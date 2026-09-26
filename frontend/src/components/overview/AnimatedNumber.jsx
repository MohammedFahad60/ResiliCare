import { motion } from "framer-motion";

function AnimatedNumber({ value, decimals = 0 }) {
  const formatted = Number(value).toFixed(decimals);

  return (
    <motion.span
      key={formatted}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {formatted}
    </motion.span>
  );
}

export default AnimatedNumber;