import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  MapPin,
  Globe,
  FileText,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Award,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';

export async function getServerSideProps(context) {
  const { id } = context.params;
  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api';

  try {
    const res = await fetch(`${apiUrl}/profiles/${id}`);

    if (res.status === 404) {
      return { notFound: true };
    }

    if (!res.ok) {
      return {
        props: {
          profile: null,
          error: `Failed to load profile (status ${res.status})`,
          id,
        },
      };
    }

    const data = await res.json();
    const profile = data.profile || data.data || data;

    return {
      props: {
        profile,
        id,
      },
    };
  } catch (err) {
    return {
      props: {
        profile: null,
        error: 'Unable to connect to server',
        id,
      },
    };
  }
}

export default function PublicProfileSSR({ profile, error, id }) {
  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto my-16 px-4 w-full">
          <Card className="text-center py-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Unavailable</h2>
            <p className="text-sm text-gray-500 mb-6">
              {error || 'The requested profile could not be retrieved.'}
            </p>
            <Link href="/">
              <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Feed
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const user = profile.user || {};
  const name = user.name || 'ConnectHub Member';
  const headline = profile.headline || user.headline || 'Professional on ConnectHub';
  const summary = profile.summary || '';
  const location = profile.location || '';
  const website = profile.website || '';
  const avatarUrl = user.avatar || '/default-avatar.png';
  const skills = profile.skills || [];
  const experience = profile.experience || [];
  const education = profile.education || [];

  const pdfDownloadUrl = `${
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  }/profiles/${id}/pdf`;

  const formattedWebsite =
    website.startsWith('http://') || website.startsWith('https://')
      ? website
      : `https://${website}`;

  const formatDate = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return String(val);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>{`${name} | ConnectHub`}</title>
        <meta
          name="description"
          content={headline || summary || `${name}'s public profile on ConnectHub`}
        />
        {/* OpenGraph Tags for SSR Social Sharing */}
        <meta property="og:title" content={`${name} - ConnectHub`} />
        <meta
          property="og:description"
          content={headline || summary || `${name}'s public profile on ConnectHub`}
        />
        <meta property="og:image" content={avatarUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://connecthub.internal/profile/${id}`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${name} - ConnectHub`} />
        <meta name="twitter:description" content={headline} />
        <meta name="twitter:image" content={avatarUrl} />
      </Head>

      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile Hero Card with Banner & Avatar */}
        <Card noPadding className="shadow-sm overflow-hidden">
          <div className="h-40 sm:h-52 bg-gradient-to-r from-brand-800 via-brand-600 to-blue-600 relative">
            <div className="absolute right-4 top-4">
              <span className="bg-black/30 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Verified Public Profile</span>
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
              <Avatar
                src={user.avatar}
                name={name}
                size="2xl"
                className="ring-4 ring-white shadow-md bg-white"
              />

              {/* Download PDF Resume Action */}
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <a
                  href={pdfDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`${name.replace(/\s+/g, '_')}_Resume.pdf`}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<FileText className="w-4 h-4 text-white" />}
                  >
                    Download PDF Resume
                  </Button>
                </a>
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{name}</h1>
              <p className="text-base text-gray-700 font-medium">{headline}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-1">
                {location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{location}</span>
                  </span>
                )}

                {website && (
                  <a
                    href={formattedWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-brand-600 hover:text-brand-700 hover:underline font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[200px]">{website}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Summary / About */}
        {summary && (
          <Card className="shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <span>About</span>
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {summary}
            </p>
          </Card>
        )}

        {/* Work Experience */}
        {experience.length > 0 && (
          <Card className="shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-brand-600" />
              <span>Experience</span>
            </h2>

            <div className="space-y-6">
              {experience.map((exp, idx) => {
                const fromDate = formatDate(exp.from || exp.startDate);
                const toDate = exp.current
                  ? 'Present'
                  : formatDate(exp.to || exp.endDate) || 'Present';

                return (
                  <div key={idx} className="flex items-start space-x-3.5 group">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-brand-600">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                        {exp.title}
                      </h3>
                      <p className="text-xs font-medium text-gray-700">
                        {exp.company}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                      {fromDate && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {fromDate} - {toDate}
                          </span>
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Skills & Endorsements */}
        {skills.length > 0 && (
          <Card className="shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
              <Award className="w-5 h-5 text-brand-600" />
              <span>Skills & Expertise</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-50 text-brand-700 border border-blue-200 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Card className="shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <span>Education</span>
            </h2>

            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={idx} className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{edu.school}</h3>
                    <p className="text-xs text-gray-600">
                      {edu.degree}
                      {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                    </p>
                    {(edu.from || edu.to || edu.year) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(edu.from || edu.startDate)}
                        {edu.to ? ` - ${formatDate(edu.to || edu.endDate)}` : ''}
                        {edu.year ? ` • ${edu.year}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
