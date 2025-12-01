import { useState, useEffect } from 'react';
import { Calendar, Tool, Users, AlertTriangle, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../services/api';

const EVENT_TYPES = {
  ESSAI: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Calendar
  },
  CALIBRATION: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Tool
  },
  CONTROLE: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Users
  },
  NC: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle
  }
};

export default function LabCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      const [essaisResponse, calibrationsResponse, controlesResponse, ncResponse] = await Promise.all([
        api.get('/essais/', { params: { date_debut: start, date_fin: end } }),
        api.get('/qualite/calibrations/', { params: { date_debut: start, date_fin: end } }),
        api.get('/qualite/controles/', { params: { date_debut: start, date_fin: end } }),
        api.get('/qualite/non-conformites/', { params: { date_debut: start, date_fin: end } })
      ]);

      const events = [
        ...essaisResponse.data.map(essai => ({
          id: `essai-${essai.id}`,
          type: 'ESSAI',
          title: `Essai ${essai.numero_essai}`,
          date: essai.date_essai,
          description: `${essai.type_essai} - ${essai.operateur?.username}`,
          data: essai
        })),
        ...calibrationsResponse.data.map(cal => ({
          id: `cal-${cal.id}`,
          type: 'CALIBRATION',
          title: `Calibration ${cal.equipement}`,
          date: cal.date_calibration,
          description: `N° série: ${cal.numero_serie}`,
          data: cal
        })),
        ...controlesResponse.data.map(ctrl => ({
          id: `ctrl-${ctrl.id}`,
          type: 'CONTROLE',
          title: ctrl.titre,
          date: ctrl.date_prevue,
          description: ctrl.description,
          data: ctrl
        })),
        ...ncResponse.data.map(nc => ({
          id: `nc-${nc.id}`,
          type: 'NC',
          title: nc.titre,
          date: nc.created_at,
          description: nc.description,
          data: nc
        }))
      ];

      setEvents(events);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getDayEvents = (date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Calendrier du laboratoire
            </h1>
            <p className="text-gray-600 mt-1">
              Planning des essais, calibrations et contrôles
            </p>
          </div>
          <button
            onClick={() => setShowEventForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouvel événement
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={previousMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 py-2 text-sm font-medium text-gray-900 text-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {Array.from({ length: new Date(days[0]).getDay() - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white h-32" />
          ))}
          
          {days.map((day) => {
            const dayEvents = getDayEvents(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <div
                key={day.toISOString()}
                className={`bg-white p-2 h-32 hover:bg-gray-50 cursor-pointer ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isSameDay(day, new Date())
                      ? 'text-blue-600'
                      : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => {
                    const { color, icon: Icon } = EVENT_TYPES[event.type];
                    return (
                      <div
                        key={event.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${color}`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 pl-2">
                      +{dayEvents.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste des événements du jour sélectionné */}
      {selectedDate && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Événements du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {getDayEvents(selectedDate).map((event) => {
              const { color, icon: Icon } = EVENT_TYPES[event.type];
              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${color}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white bg-opacity-50 rounded">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{event.title}</h4>
                        <span className="text-sm">
                          {format(new Date(event.date), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
