import React, { useState } from 'react';
import { Sparkles, Plus, Check } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export default function SkillsBadges({
  skills = [],
  isOwnProfile = false,
  onEditClick,
  className = '',
}) {
  const [endorsedSkills, setEndorsedSkills] = useState({});

  const skillsList = Array.isArray(skills)
    ? skills.filter(Boolean)
    : typeof skills === 'string'
    ? skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const handleEndorse = (skill) => {
    if (isOwnProfile) return;
    setEndorsedSkills((prev) => ({
      ...prev,
      [skill]: !prev[skill],
    }));
  };

  return (
    <Card className={`shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <span>Skills & Endorsements</span>
        </h2>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEditClick}
            icon={<Plus className="w-4 h-4 text-brand-600" />}
            className="text-brand-600 font-semibold"
          >
            Add Skill
          </Button>
        )}
      </div>

      {skillsList.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {skillsList.map((skill, idx) => {
            const isEndorsed = Boolean(endorsedSkills[skill]);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleEndorse(skill)}
                disabled={isOwnProfile}
                title={
                  isOwnProfile
                    ? skill
                    : isEndorsed
                    ? 'Endorsed! Click to remove endorsement'
                    : 'Click to endorse this skill'
                }
                className={`group px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 flex items-center space-x-1.5 select-none ${
                  isEndorsed
                    ? 'bg-brand-600 text-white border-brand-600 shadow-2xs'
                    : 'bg-brand-50/70 hover:bg-brand-100 text-brand-800 border-brand-200'
                } ${isOwnProfile ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02]'}`}
              >
                <span>{skill}</span>
                {!isOwnProfile && (
                  <span
                    className={`text-[10px] rounded-full p-0.5 ml-1 transition-opacity ${
                      isEndorsed
                        ? 'bg-white/20 text-white'
                        : 'text-brand-500 opacity-60 group-hover:opacity-100'
                    }`}
                  >
                    {isEndorsed ? <Check className="w-2.5 h-2.5" /> : '+'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-gray-500">
          <p>No skills added yet.</p>
          {isOwnProfile && (
            <p className="text-gray-400 mt-1">
              Add relevant skills to showcase your professional strengths.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
