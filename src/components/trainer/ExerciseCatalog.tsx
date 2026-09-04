import React, { useState, useMemo, useDeferredValue, useEffect, useRef, memo } from 'react';
import { Dumbbell, Search, SlidersHorizontal, Plus, Check, Loader2 } from 'lucide-react';
import { Exercise } from '../../types/database';
import { EXERCISES_DATABASE } from '../../data/exercisesData';
import { ExerciseMedia } from '../common/ExerciseMedia';

interface ExerciseCatalogProps {
  activeSplitDay: string;
  inPlanCounts: Record<string, number>;
  onAddExercise: (exercise: Exercise) => void;
}

const MUSCLE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'Peitoral', label: 'Peitoral' },
  { id: 'Dorsal', label: 'Dorsal' },
  { id: 'Quadríceps', label: 'Quadríceps' },
  { id: 'Isquiotibiais', label: 'Isquiotibiais' },
  { id: 'Glúteos', label: 'Glúteos' },
  { id: 'Deltoides', label: 'Deltoides' },
  { id: 'Tríceps', label: 'Tríceps' },
  { id: 'Bíceps', label: 'Bíceps' },
  { id: 'Abdômen', label: 'Abdômen' },
];

const INITIAL_PAGE_SIZE = 24;
const PAGE_INCREMENT = 24;

interface ExerciseCardProps {
  exercise: Exercise;
  inPlanCount: number;
  isJustAdded: boolean;
  activeSplitDay: string;
  onAdd: (exercise: Exercise) => void;
}

const ExerciseCard = memo<ExerciseCardProps>(({
  exercise,
  inPlanCount,
  isJustAdded,
  activeSplitDay,
  onAdd,
}) => {
  return (
    <div className="flex flex-col bg-[#222a3d] hover:bg-[#283248] rounded-xl overflow-hidden border border-[#3c4a42]/40 shadow-sm transition-all group">
      <div className="relative w-full h-[125px] bg-[#0b1326] overflow-hidden">
        <ExerciseMedia
          exerciseId={exercise.id}
          name={exercise.name}
          targetMuscle={exercise.target_muscle}
          equipment={exercise.equipment}
          className="w-full h-full"
        />
      </div>

      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <div>
          <h3
            className="font-bold text-xs text-[#dae2fd] line-clamp-1 group-hover:text-[#4edea3] transition-colors"
            title={exercise.name}
          >
            {exercise.name}
          </h3>
          <p className="text-[11px] text-[#bbcabf] line-clamp-2 mt-1 leading-relaxed">
            {exercise.instructions_pt}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAdd(exercise)}
          className={`w-full mt-2 h-9 px-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm whitespace-nowrap cursor-pointer select-none ${
            isJustAdded
              ? 'bg-[#4edea3] text-[#003824] shadow-md shadow-[#4edea3]/30 scale-[1.01]'
              : 'bg-[#10b981] hover:bg-[#4edea3] text-[#003824] shadow-md shadow-[#10b981]/20'
          }`}
          title={`Adicionar ${exercise.name} ao Treino ${activeSplitDay}`}
        >
          {isJustAdded ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="whitespace-nowrap">Adicionado!</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="whitespace-nowrap tracking-tight">Adicionar ao Treino {activeSplitDay}</span>
              {inPlanCount > 0 && (
                <span className="ml-0.5 font-mono-metric text-[10px] bg-[#003824]/20 text-[#003824] px-1.5 py-0.2 rounded-full font-extrabold">
                  {inPlanCount}x
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
});

ExerciseCard.displayName = 'ExerciseCard';

export const ExerciseCatalog: React.FC<ExerciseCatalogProps> = memo(({
  activeSplitDay,
  inPlanCounts,
  onAddExercise,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const deferredSearch = useDeferredValue(searchFilter);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_PAGE_SIZE);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [deferredSearch, selectedMuscle, selectedEquipment]);

  // Filter calculation with optimized conditions
  const filteredCatalog = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const muscleTarget = selectedMuscle.toLowerCase();
    const equipTarget = selectedEquipment.toLowerCase();

    return EXERCISES_DATABASE.filter(ex => {
      // Muscle filter
      if (selectedMuscle !== 'all') {
        const matchBody = ex.body_part.toLowerCase() === muscleTarget;
        const matchTarget = ex.target_muscle.toLowerCase().includes(muscleTarget);
        const matchPernas =
          selectedMuscle === 'Quadríceps' &&
          (ex.target_muscle.toLowerCase().includes('quad') ||
            (ex.body_part === 'Pernas' &&
              !ex.target_muscle.includes('Isquio') &&
              !ex.target_muscle.includes('Glúteo')));
        const matchIsquios =
          selectedMuscle === 'Isquiotibiais' &&
          (ex.target_muscle.toLowerCase().includes('isquio') ||
            ex.target_muscle.toLowerCase().includes('hamstring') ||
            ex.target_muscle.toLowerCase().includes('femoral'));
        const matchGluteos =
          selectedMuscle === 'Glúteos' && ex.target_muscle.toLowerCase().includes('glúteo');
        const matchDorsal =
          selectedMuscle === 'Dorsal' &&
          (ex.body_part === 'Dorsal' ||
            ex.target_muscle.includes('Dorsal') ||
            ex.target_muscle.includes('Trapézio'));
        const matchBracos =
          selectedMuscle === 'Bíceps'
            ? ex.target_muscle.includes('Bíceps')
            : selectedMuscle === 'Tríceps'
            ? ex.target_muscle.includes('Tríceps')
            : false;

        if (
          !matchBody &&
          !matchTarget &&
          !matchPernas &&
          !matchIsquios &&
          !matchGluteos &&
          !matchDorsal &&
          !matchBracos
        ) {
          return false;
        }
      }

      // Equipment filter
      if (selectedEquipment !== 'all' && !ex.equipment.toLowerCase().includes(equipTarget)) {
        return false;
      }

      // Search text filter
      if (query) {
        const matchName = ex.name.toLowerCase().includes(query);
        const matchTarget = ex.target_muscle.toLowerCase().includes(query);
        const matchBody = ex.body_part.toLowerCase().includes(query);
        const matchEquip = ex.equipment.toLowerCase().includes(query);
        if (!matchName && !matchTarget && !matchBody && !matchEquip) return false;
      }

      return true;
    });
  }, [selectedMuscle, selectedEquipment, deferredSearch]);

  // Paginated slice
  const displayedExercises = useMemo(() => {
    return filteredCatalog.slice(0, visibleCount);
  }, [filteredCatalog, visibleCount]);

  const hasMore = visibleCount < filteredCatalog.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_INCREMENT, filteredCatalog.length));
  };

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + PAGE_INCREMENT, filteredCatalog.length));
        }
      },
      { rootMargin: '180px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, filteredCatalog.length]);

  const handleAdd = (exercise: Exercise) => {
    onAddExercise(exercise);
    setJustAddedId(exercise.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1200);
  };

  return (
    <aside className="xl:col-span-5 bg-[#171f33] rounded-2xl p-4 sm:p-5 border border-[#3c4a42]/40 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#4edea3]" />
          <h2 className="text-base font-bold text-[#dae2fd]">Catálogo Técnico de Exercícios</h2>
        </div>
        <span className="font-mono-metric text-xs text-[#86948a] font-semibold">
          {filteredCatalog.length} catalogados
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#86948a] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nome, músculo ou equipamento..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0b1326] text-[#dae2fd] placeholder:text-[#86948a] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none transition-all shadow-inner"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#86948a] hover:text-[#dae2fd]"
          >
            ×
          </button>
        )}
      </div>

      {/* Muscle Group Chips Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {MUSCLE_FILTERS.map(muscle => (
          <button
            key={muscle.id}
            type="button"
            onClick={() => setSelectedMuscle(muscle.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedMuscle === muscle.id
                ? 'bg-[#10b981] text-[#003824] font-bold shadow-sm'
                : 'bg-[#0b1326] text-[#bbcabf] hover:bg-[#222a3d] hover:text-[#dae2fd]'
            }`}
          >
            {muscle.label}
          </button>
        ))}
      </div>

      {/* Equipment Dropdown Filter */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-[#86948a] flex-shrink-0" />
        <label className="text-xs text-[#bbcabf] font-semibold">Equipamento:</label>
        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
          className="flex-1 h-9 px-3 rounded-lg bg-[#0b1326] text-[#dae2fd] text-xs border border-[#3c4a42]/60 focus:border-[#4edea3] focus:outline-none cursor-pointer"
        >
          <option value="all">Todos Equipamentos</option>
          <option value="Halteres">Halteres (Dumbbells)</option>
          <option value="Barra">Barra Livre (Barbell)</option>
          <option value="Polia">Polia / Cabo (Cable Machine)</option>
          <option value="Máquina">Máquinas Articuladas</option>
          <option value="Peso Corporal">Peso Corporal (Calistenia)</option>
          <option value="Elástico">Elásticos / Bands</option>
        </select>
      </div>

      {/* Result Counter & Pagination Status */}
      <div className="flex items-center justify-between text-[11px] font-mono-metric text-[#86948a] px-1">
        <span>
          Mostrando <strong className="text-[#dae2fd]">{displayedExercises.length}</strong> de <strong className="text-[#dae2fd]">{filteredCatalog.length}</strong>
        </span>
        {filteredCatalog.length > displayedExercises.length && (
          <span className="text-[#4edea3]">Rolagem com carregamento rápido</span>
        )}
      </div>

      {/* Exercise Cards Grid (Paginated & Virtualized through Batch Rendering) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[720px] pr-1">
        {displayedExercises.map(exercise => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            inPlanCount={inPlanCounts[exercise.id] || 0}
            isJustAdded={justAddedId === exercise.id}
            activeSplitDay={activeSplitDay}
            onAdd={handleAdd}
          />
        ))}

        {/* Sentinel for infinite scroll */}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="col-span-1 sm:col-span-2 py-4 flex flex-col items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-4 py-2 rounded-xl bg-[#222a3d] hover:bg-[#283248] text-[#4edea3] font-semibold text-xs border border-[#3c4a42]/60 transition-all flex items-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Carregar mais (+{Math.min(PAGE_INCREMENT, filteredCatalog.length - visibleCount)})</span>
            </button>
          </div>
        )}

        {displayedExercises.length === 0 && (
          <div className="col-span-1 sm:col-span-2 p-8 text-center bg-[#0b1326] rounded-xl border border-dashed border-[#3c4a42]/50 text-xs text-[#86948a]">
            Nenhum exercício encontrado com os filtros selecionados.
          </div>
        )}
      </div>
    </aside>
  );
});

ExerciseCatalog.displayName = 'ExerciseCatalog';
