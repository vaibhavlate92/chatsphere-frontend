import { motion } from 'framer-motion';
import StartButtons from '../components/StartButtons';

export default function Landing() {
  return (
    <section className="hero">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: 'easeOut' }} style={{ position: 'relative' }}>
        <h1>Meet New People<br />Instantly</h1>
        <p>Connect with random people worldwide through secure text and video chat.</p>
        <StartButtons render={(go) => (
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <button className="btn-grad btn-lg" onClick={() => go('text')}>Start Text Chat</button>
            <button className="btn-ghost btn-lg" onClick={() => go('video')}>Start Video Chat</button>
          </div>
        )} />
        <p className="small mt-4 mb-0">18+ only. Be respectful, and report anyone who isn’t.</p>
      </motion.div>
    </section>
  );
}
