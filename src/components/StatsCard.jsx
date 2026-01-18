import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, color }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 flex items-center gap-4"
        >
            <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>
                {Icon ? <Icon size={24} /> : null}
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
        </motion.div>
    );
};

export default StatsCard;
