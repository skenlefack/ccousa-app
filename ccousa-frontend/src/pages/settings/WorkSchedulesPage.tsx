import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  Star,
  Copy,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  IconButton,
  Input,
  Toggle,
  Badge,
  Modal,
  ModalBody,
  ModalFooter,
  ConfirmModal,
  Select,
  Skeleton,
  NoDataEmpty,
} from '../../components/ui';
import { cn } from '../../utils/cn';
import {
  useWorkSchedules,
  useCreateWorkSchedule,
  useUpdateWorkSchedule,
  useDeleteWorkSchedule,
  useTimezones,
} from '../../hooks/useSettings';
import type { WorkSchedule, WorkScheduleDay } from '../../types';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' },
  { value: 0, label: 'Dimanche', short: 'Dim' },
];

const DEFAULT_DAY: Omit<WorkScheduleDay, 'id' | 'workScheduleId'> = {
  dayOfWeek: 1 as WorkScheduleDay['dayOfWeek'],
  startTime: '08:00',
  endTime: '17:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  breakDurationMinutes: 60,
  isWorkingDay: true,
};

interface FormData {
  code: string;
  name: string;
  description: string;
  timezoneId: string;
  startDate: string;
  endDate: string;
  isDefault: boolean;
  isActive: boolean;
  days: Array<Omit<WorkScheduleDay, 'id' | 'workScheduleId'>>;
}

const defaultFormData: FormData = {
  code: '',
  name: '',
  description: '',
  timezoneId: '',
  startDate: '',
  endDate: '',
  isDefault: false,
  isActive: true,
  days: DAYS_OF_WEEK.map((day) => ({
    ...DEFAULT_DAY,
    dayOfWeek: day.value as WorkScheduleDay['dayOfWeek'],
    isWorkingDay: day.value !== 0 && day.value !== 6, // Weekend off by default
  })),
};

// Time slot visualization
const TimeSlotVisualizer: React.FC<{
  day: Omit<WorkScheduleDay, 'id' | 'workScheduleId'>;
}> = ({ day }) => {
  if (!day.isWorkingDay) {
    return (
      <div className="h-8 rounded-lg bg-dark-100 dark:bg-dark-700 flex items-center justify-center">
        <span className="text-xs text-dark-400">Repos</span>
      </div>
    );
  }

  const totalMinutes = 24 * 60;
  const startMinutes = parseInt(day.startTime.split(':')[0]) * 60 + parseInt(day.startTime.split(':')[1]);
  const endMinutes = parseInt(day.endTime.split(':')[0]) * 60 + parseInt(day.endTime.split(':')[1]);

  const startPercent = (startMinutes / totalMinutes) * 100;
  const endPercent = (endMinutes / totalMinutes) * 100;
  const width = endPercent - startPercent;

  return (
    <div className="h-8 rounded-lg bg-dark-100 dark:bg-dark-700 relative overflow-hidden">
      {/* Time scale markers */}
      {[6, 12, 18].map((hour) => (
        <div
          key={hour}
          className="absolute top-0 bottom-0 w-px bg-dark-200 dark:bg-dark-600"
          style={{ left: `${(hour / 24) * 100}%` }}
        />
      ))}

      {/* Work period */}
      <div
        className="absolute top-1 bottom-1 rounded bg-gradient-to-r from-primary-500 to-primary-400"
        style={{
          left: `${startPercent}%`,
          width: `${width}%`,
        }}
      />

      {/* Break period */}
      {day.breakStartTime && day.breakEndTime && (
        <div
          className="absolute top-1 bottom-1 rounded bg-amber-400"
          style={{
            left: `${(parseInt(day.breakStartTime.split(':')[0]) * 60 / totalMinutes) * 100}%`,
            width: `${((parseInt(day.breakEndTime.split(':')[0]) - parseInt(day.breakStartTime.split(':')[0])) * 60 / totalMinutes) * 100}%`,
          }}
        />
      )}

      {/* Time labels */}
      <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-dark-400">
        <span>00:00</span>
        <span>12:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
};

// Schedule card component
const ScheduleCard: React.FC<{
  schedule: WorkSchedule;
  onEdit: (schedule: WorkSchedule) => void;
  onDelete: (schedule: WorkSchedule) => void;
  onDuplicate: (schedule: WorkSchedule) => void;
}> = ({ schedule, onEdit, onDelete, onDuplicate }) => {
  const workingDays = schedule.days?.filter((d) => d.isWorkingDay).length || 0;

  // Get typical work hours
  const getTypicalHours = () => {
    const workingDay = schedule.days?.find((d) => d.isWorkingDay);
    if (!workingDay) return 'Non défini';
    return `${workingDay.startTime} - ${workingDay.endTime}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <Card
        variant="glass"
        padding="none"
        hover
        className={cn(!schedule.isActive && 'opacity-60')}
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-100 dark:border-dark-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-dark-900 dark:text-white">
                    {schedule.name}
                  </h3>
                  {schedule.isDefault && (
                    <Badge variant="primary" size="xs">
                      <Star className="w-3 h-3 mr-1" />
                      Par défaut
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-dark-500 font-mono">{schedule.code}</p>
              </div>
            </div>

            <Badge
              variant={schedule.isActive ? 'success' : 'default'}
              size="xs"
              dot
            >
              {schedule.isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {schedule.description && (
            <p className="mt-3 text-sm text-dark-500 dark:text-dark-400">
              {schedule.description}
            </p>
          )}
        </div>

        {/* Schedule preview */}
        <div className="p-4">
          <div className="flex items-center gap-6 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-dark-600 dark:text-dark-300">
                {workingDays} jours/sem
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              <span className="text-dark-600 dark:text-dark-300">
                {getTypicalHours()}
              </span>
            </div>
          </div>

          {/* Days preview */}
          <div className="space-y-2">
            {DAYS_OF_WEEK.slice(0, 5).map((day) => {
              const scheduleDay = schedule.days?.find((d) => d.dayOfWeek === day.value);
              return (
                <div key={day.value} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-medium text-dark-500">
                    {day.short}
                  </span>
                  <div className="flex-1">
                    <TimeSlotVisualizer
                      day={scheduleDay || { ...DEFAULT_DAY, dayOfWeek: day.value as WorkScheduleDay['dayOfWeek'], isWorkingDay: false }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-dark-100 dark:border-dark-700 bg-dark-50/50 dark:bg-dark-700/30">
          <div className="text-xs text-dark-500">
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            {schedule.startDate
              ? `${new Date(schedule.startDate).toLocaleDateString('fr-FR')} - ${
                  schedule.endDate
                    ? new Date(schedule.endDate).toLocaleDateString('fr-FR')
                    : 'Indéfini'
                }`
              : 'Permanent'}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Copy className="w-4 h-4" />}
              onClick={() => onDuplicate(schedule)}
              aria-label="Dupliquer"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => onEdit(schedule)}
              aria-label="Modifier"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-500" />}
              onClick={() => onDelete(schedule)}
              aria-label="Supprimer"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const WorkSchedulesPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: schedules, isLoading } = useWorkSchedules();
  const { data: timezones } = useTimezones();
  const createSchedule = useCreateWorkSchedule();
  const updateSchedule = useUpdateWorkSchedule();
  const deleteSchedule = useDeleteWorkSchedule();

  // Handle form changes
  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle day changes
  const handleDayChange = (
    dayIndex: number,
    field: keyof Omit<WorkScheduleDay, 'id' | 'workScheduleId'>,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.map((day, i) =>
        i === dayIndex ? { ...day, [field]: value } : day
      ),
    }));
  };

  // Open modal for create
  const handleCreate = () => {
    setSelectedSchedule(null);
    setFormData({
      ...defaultFormData,
      timezoneId: timezones?.[0]?.id || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      code: schedule.code,
      name: schedule.name,
      description: schedule.description || '',
      timezoneId: schedule.timezoneId,
      startDate: schedule.startDate || '',
      endDate: schedule.endDate || '',
      isDefault: schedule.isDefault,
      isActive: schedule.isActive,
      days: DAYS_OF_WEEK.map((day) => {
        const existingDay = schedule.days?.find((d) => d.dayOfWeek === day.value);
        return existingDay
          ? {
              dayOfWeek: existingDay.dayOfWeek,
              startTime: existingDay.startTime,
              endTime: existingDay.endTime,
              breakStartTime: existingDay.breakStartTime,
              breakEndTime: existingDay.breakEndTime,
              breakDurationMinutes: existingDay.breakDurationMinutes,
              isWorkingDay: existingDay.isWorkingDay,
            }
          : { ...DEFAULT_DAY, dayOfWeek: day.value as WorkScheduleDay['dayOfWeek'], isWorkingDay: false };
      }),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Duplicate schedule
  const handleDuplicate = (schedule: WorkSchedule) => {
    setSelectedSchedule(null);
    setFormData({
      code: `${schedule.code}_COPY`,
      name: `${schedule.name} (copie)`,
      description: schedule.description || '',
      timezoneId: schedule.timezoneId,
      startDate: '',
      endDate: '',
      isDefault: false,
      isActive: true,
      days: DAYS_OF_WEEK.map((day) => {
        const existingDay = schedule.days?.find((d) => d.dayOfWeek === day.value);
        return existingDay
          ? {
              dayOfWeek: existingDay.dayOfWeek,
              startTime: existingDay.startTime,
              endTime: existingDay.endTime,
              breakStartTime: existingDay.breakStartTime,
              breakEndTime: existingDay.breakEndTime,
              breakDurationMinutes: existingDay.breakDurationMinutes,
              isWorkingDay: existingDay.isWorkingDay,
            }
          : { ...DEFAULT_DAY, dayOfWeek: day.value as WorkScheduleDay['dayOfWeek'], isWorkingDay: false };
      }),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    }

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (!formData.timezoneId) {
      errors.timezoneId = 'Le fuseau horaire est requis';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const data = {
      code: formData.code,
      name: formData.name,
      description: formData.description || undefined,
      timezoneId: formData.timezoneId,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      isDefault: formData.isDefault,
      isActive: formData.isActive,
      days: formData.days,
    };

    try {
      if (selectedSchedule) {
        await updateSchedule.mutateAsync({
          id: selectedSchedule.id,
          data,
        });
      } else {
        await createSchedule.mutateAsync(data);
      }
      setModalOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Delete schedule
  const handleDelete = async () => {
    if (!selectedSchedule) return;

    try {
      await deleteSchedule.mutateAsync(selectedSchedule.id);
      setDeleteModalOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = createSchedule.isPending || updateSchedule.isPending;

  const timezoneOptions =
    timezones?.map((tz) => ({
      value: tz.id,
      label: `${tz.name} (${tz.offset})`,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white">
            Horaires de travail
          </h2>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Configurez les plannings de travail de votre organisation
          </p>
        </div>
        <Button
          onClick={handleCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nouveau planning
        </Button>
      </div>

      {/* Schedules grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : !schedules || schedules.length === 0 ? (
        <NoDataEmpty
          onAdd={handleCreate}
          addLabel="Créer un planning"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onDuplicate={handleDuplicate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedSchedule ? 'Modifier le planning' : 'Nouveau planning de travail'}
        size="xl"
      >
        <ModalBody>
          <div className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="STANDARD_WEEK"
                error={formErrors.code}
              />
              <Input
                label="Nom"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Semaine standard"
                error={formErrors.name}
              />
            </div>

            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du planning..."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Fuseau horaire"
                value={formData.timezoneId}
                onChange={(value) => handleChange('timezoneId', value)}
                options={timezoneOptions}
                error={formErrors.timezoneId}
              />
              <Input
                label="Date de début"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
              <Input
                label="Date de fin"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
              />
            </div>

            {/* Days configuration */}
            <div>
              <h4 className="text-sm font-medium text-dark-700 dark:text-dark-200 mb-4">
                Configuration des jours
              </h4>
              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day, index) => {
                  const dayData = formData.days[index];
                  return (
                    <div
                      key={day.value}
                      className={cn(
                        'p-4 rounded-xl border transition-colors',
                        dayData.isWorkingDay
                          ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/30'
                          : 'bg-dark-50 dark:bg-dark-700/50 border-dark-200 dark:border-dark-600'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Toggle
                            checked={dayData.isWorkingDay}
                            onChange={(checked) => handleDayChange(index, 'isWorkingDay', checked)}
                            size="sm"
                          />
                          <span className="font-medium text-dark-900 dark:text-white">
                            {day.label}
                          </span>
                        </div>
                        {dayData.isWorkingDay && (
                          <span className="text-sm text-dark-500">
                            {dayData.startTime} - {dayData.endTime}
                          </span>
                        )}
                      </div>

                      {dayData.isWorkingDay && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Input
                            label="Début"
                            type="time"
                            value={dayData.startTime}
                            onChange={(e) => handleDayChange(index, 'startTime', e.target.value)}
                            size="sm"
                          />
                          <Input
                            label="Fin"
                            type="time"
                            value={dayData.endTime}
                            onChange={(e) => handleDayChange(index, 'endTime', e.target.value)}
                            size="sm"
                          />
                          <Input
                            label="Pause début"
                            type="time"
                            value={dayData.breakStartTime || ''}
                            onChange={(e) => handleDayChange(index, 'breakStartTime', e.target.value)}
                            size="sm"
                          />
                          <Input
                            label="Pause fin"
                            type="time"
                            value={dayData.breakEndTime || ''}
                            onChange={(e) => handleDayChange(index, 'breakEndTime', e.target.value)}
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                <div>
                  <p className="font-medium text-dark-900 dark:text-white">
                    Planning par défaut
                  </p>
                  <p className="text-sm text-dark-500">
                    Utilisé pour les nouveaux utilisateurs
                  </p>
                </div>
                <Toggle
                  checked={formData.isDefault}
                  onChange={(checked) => handleChange('isDefault', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-700/50">
                <div>
                  <p className="font-medium text-dark-900 dark:text-white">
                    Planning actif
                  </p>
                  <p className="text-sm text-dark-500">
                    Disponible pour assignation
                  </p>
                </div>
                <Toggle
                  checked={formData.isActive}
                  onChange={(checked) => handleChange('isActive', checked)}
                />
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setModalOpen(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {selectedSchedule ? 'Enregistrer' : 'Créer'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer le planning"
        message={`Êtes-vous sûr de vouloir supprimer le planning "${selectedSchedule?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
        isLoading={deleteSchedule.isPending}
      />
    </div>
  );
};

export default WorkSchedulesPage;
