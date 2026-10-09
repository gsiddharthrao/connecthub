const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');
const Connection = require('../models/Connection');

/**
 * Seed initial demonstration data into database if Sarah Chen doesn't exist.
 * Idempotent: Skips if data is already present.
 */
async function seedDemoData() {
  if (process.env.NODE_ENV === 'test') {
    return; // Do not auto-seed during automated tests
  }

  try {
    const existingDemoUser = await User.findOne({ email: 'sarah.chen@techcorp.io' });
    if (existingDemoUser) {
      // Data already present
      return;
    }

    console.log('[Seeder] Initializing demonstration accounts and sample data...');

    // 1. Create Demo Users
    const sarah = await User.create({
      name: 'Sarah Chen',
      email: 'sarah.chen@techcorp.io',
      password: 'Password123!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });

    const alex = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@techcorp.io',
      password: 'Password123!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const david = await User.create({
      name: 'David Kim',
      email: 'david.kim@techcorp.io',
      password: 'Password123!',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    });

    // 2. Create Profiles
    await Profile.create({
      user: sarah._id,
      headline: 'Staff Distributed Systems Engineer @ TechCorp | Cloud Architecture & Scalability',
      summary: 'Passionate engineering leader building resilient cloud-native networking platforms, distributed microservices, and high-throughput data pipelines.',
      location: 'San Francisco, CA',
      skills: ['Node.js', 'Next.js', 'React', 'MongoDB Atlas', 'Distributed Systems', 'System Design'],
      experience: [
        {
          title: 'Staff Distributed Systems Engineer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          from: new Date('2022-01-01'),
          current: true,
          description: 'Leading architecture for cloud-native applications and global social graph systems.',
        },
        {
          title: 'Senior Backend Engineer',
          company: 'CloudScale Labs',
          location: 'San Francisco, CA',
          from: new Date('2019-03-01'),
          to: new Date('2021-12-31'),
          current: false,
          description: 'Architected high-volume REST and real-time APIs handling 50k+ req/sec.',
        },
      ],
      education: [
        {
          school: 'UC Berkeley',
          degree: 'B.S. in Computer Science',
          fieldOfStudy: 'Distributed Computing',
          from: new Date('2015-09-01'),
          to: new Date('2019-05-15'),
        },
      ],
    });

    await Profile.create({
      user: alex._id,
      headline: 'Principal Frontend Engineer | React & Next.js Design Systems',
      summary: 'Crafting accessible, high-performance web experiences with modern design systems and intuitive UX patterns.',
      location: 'New York, NY',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Web Performance'],
      experience: [
        {
          title: 'Principal Frontend Engineer',
          company: 'DesignCraft Solutions',
          location: 'New York, NY',
          from: new Date('2021-06-01'),
          current: true,
          description: 'Standardizing enterprise component libraries and responsive web application frontends.',
        },
      ],
    });

    await Profile.create({
      user: david._id,
      headline: 'Senior Cloud Architect & DevOps Specialist | Reliability Engineering',
      summary: 'Specializing in container orchestration, infrastructure-as-code, and resilient automated deployment pipelines.',
      location: 'Seattle, WA',
      skills: ['Docker', 'AWS', 'CI/CD Pipelines', 'MongoDB Atlas', 'Terraform', 'Linux'],
      experience: [
        {
          title: 'Senior DevOps Architect',
          company: 'CloudWave Technologies',
          location: 'Seattle, WA',
          from: new Date('2020-03-01'),
          current: true,
          description: 'Managing multi-region cloud infrastructures and automated zero-downtime releases.',
        },
      ],
    });

    // 3. Create Sample Posts
    const post1 = await Post.create({
      user: sarah._id,
      content: 'Excited to announce the complete production upgrade of ConnectHub! 🚀\n\nBuilt with Next.js 14, Express, MongoDB Atlas, and Redux Toolkit. Features include atomic like counters, soft-deletes, SSR preview metadata, and stream-based PDF resume generation.\n\n#architecture #nodejs #nextjs #fullstack',
      likes: [alex._id, david._id],
      likesCount: 2,
    });

    const post2 = await Post.create({
      user: alex._id,
      content: 'When designing modern web applications, state management predictability is everything. Redux Toolkit slices with async thunks provide a clean contract between API boundaries and UI views. What does your favorite frontend stack look like in 2026? 💻',
      likes: [sarah._id],
      likesCount: 1,
    });

    const post3 = await Post.create({
      user: david._id,
      content: 'Pro-tip for production deployments: Always configure connection pooling and socket timeouts on your MongoDB client. Graceful shutdown handlers (SIGTERM/SIGINT) prevent severed sockets during rolling container deploys on platforms like Render. 🛡️',
      likes: [sarah._id, alex._id],
      likesCount: 2,
    });

    // 4. Create Sample Connections
    // Sarah & Alex are connected
    await Connection.create({
      requester: sarah._id,
      recipient: alex._id,
      status: 'accepted',
    });

    // David sent a connection request to Sarah (pending)
    await Connection.create({
      requester: david._id,
      recipient: sarah._id,
      status: 'pending',
    });

    console.log('[Seeder] Demo accounts, profiles, sample posts, and connections successfully seeded.');
  } catch (error) {
    console.error('[Seeder] Error during initial data seeding:', error.message);
  }
}

module.exports = { seedDemoData };
