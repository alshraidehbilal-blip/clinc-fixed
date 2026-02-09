import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CalendarView() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`);
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getAppointmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(appt => appt.date === dateStr && appt.status !== 'cancelled');
  };

  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-slate-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayAppointments = getAppointmentsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          data-testid={`calendar-day-${day}`}
          className={`h-24 border border-slate-100 p-2 cursor-pointer hover:bg-slate-50 transition-colors ${
            isToday ? 'bg-emerald-50 border-emerald-200' : 'bg-white'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-semibold ${
              isToday ? 'text-emerald-700' : 'text-slate-700'
            }`}>
              {day}
            </span>
            {dayAppointments.length > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                {dayAppointments.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayAppointments.slice(0, 2).map((appt) => (
              <div
                key={appt.id}
                onClick={() => navigate(`/patients/${appt.patient_id}`)}
                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded truncate hover:bg-blue-100"
                title={`${appt.time} - ${appt.patient_name}`}
              >
                {appt.time} {appt.patient_name}
              </div>
            ))}
            {dayAppointments.length > 2 && (
              <div className="text-xs text-slate-500 px-2">+{dayAppointments.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {monthName}
        </h2>
        <div className="flex gap-2">
          <Button
            data-testid="calendar-prev-month"
            variant="outline"
            size="sm"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            data-testid="calendar-next-month"
            variant="outline"
            size="sm"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center text-sm font-semibold text-slate-700">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>
    </div>
  );
}