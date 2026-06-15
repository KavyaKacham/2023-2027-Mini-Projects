import { motion } from 'framer-motion';

const blobs = [
  {
    color: 'bg-indigo-600/20 dark:bg-indigo-500/15',
    size: 'w-[500px] h-[500px]',
    position: 'top-[-10%] left-[-5%]',
    delay: 0,
    duration: 22,
  },
  {
    color: 'bg-cyan-500/15 dark:bg-cyan-400/10',
    size: 'w-[450px] h-[450px]',
    position: 'top-[40%] right-[-8%]',
    delay: 3,
    duration: 26,
  },
  {
    color: 'bg-purple-600/15 dark:bg-purple-500/10',
    size: 'w-[400px] h-[400px]',
    position: 'bottom-[-5%] left-[25%]',
    delay: 6,
    duration: 20,
  },
  {
    color: 'bg-pink-500/10 dark:bg-pink-500/8',
    size: 'w-[350px] h-[350px]',
    position: 'top-[20%] left-[40%]',
    delay: 9,
    duration: 24,
  },
];

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`
            absolute rounded-full blur-3xl
            ${blob.color} ${blob.size} ${blob.position}
          `}
          animate={{
            x: [0, 30, -20, 15, 0],
            y: [0, -25, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: blob.duration,
            delay: blob.delay,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid overlay for cybersecurity feel */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
