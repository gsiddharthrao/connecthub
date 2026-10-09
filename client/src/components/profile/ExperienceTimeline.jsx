import React from 'react';
import { Briefcase, Calendar, Plus, MapPin } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export default function ExperienceTimeline({
  experience = [],
  isOwnProfile = false,
  onEditClick,
  className = '',
}) {
  const formatYear = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? String(dateVal) : d.getFullYear();
    } catch {
      return String(dateVal);
    }
  };

  const hasExperience = Array.isArray(experience) && experience.length > 0;

  return (
    <Card className={`shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-brand-600" />
          <span>Experience</span>
        </h2>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            icon={<Plus className="w-4 h-4 text-brand-600" />}
            className="text-brand-600 font-semibold"
          >
            Add Experience
          </Button>
        )}
      </div>

      {hasExperience ? (
        <div className="relative pl-4 border-l-2 border-brand-100 space-y-6 my-2">
          {experience.map((exp, idx) => {
            const startYear = formatYear(exp.from);
            const endYear = exp.current ? 'Present' : formatYear(exp.to) || 'Present';
            const dateDisplay = startYear ? `${startYear} — ${endYear}` : endYear;

            return (
              <div key={exp._id || idx} className="relative group">
                {/* Timeline node bullet */}
                <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-white" />

                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    {exp.title || 'Role'}
                  </h3>

                  <p className="text-xs font-medium text-gray-700">
                    {exp.company || 'Company'}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateDisplay}</span>
                    </span>

                    {exp.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{exp.location}</span>
                      </span>
                    )}
                  </div>

                  {exp.description && (
                    <p className="text-xs text-gray-600 mt-2 whitespace-pre-line leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-gray-500">
          <p>No work experience recorded yet.</p>
          {isOwnProfile && (
            <p className="text-gray-400 mt-1">
              Add your career journey and achievements to highlight your background.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
