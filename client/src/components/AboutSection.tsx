import { motion } from 'framer-motion';

const AboutSection = () => {
    const features = [
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: "Learn from Peers",
            description: "Connect with fellow students who excel in subjects you want to master. Real experience, relatable teaching."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Earn While Teaching",
            description: "Share your expertise and earn credits. Teaching reinforces your own knowledge while helping others succeed."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            title: "Personalized Learning",
            description: "One-on-one sessions tailored to your pace and learning style. No more one-size-fits-all approach."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            title: "Live Video Sessions",
            description: "Face-to-face learning through integrated video calls. Ask questions in real-time and get instant feedback."
        }
    ];

    return (
        <section className="relative py-24 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-white to-primary-50/30">
            {/* Background decorations */}
            <div className="absolute top-20 right-0 w-72 h-72 bg-primary-100/50 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-0 w-72 h-72 bg-secondary-100/30 rounded-full blur-3xl"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-primary-700 text-xs font-bold tracking-widest uppercase mb-4 shadow-lg shadow-primary-500/10"
                    >
                        About Us
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight"
                    >
                        Revolutionizing Learning Through
                        <span className="text-primary-600"> Peer Connection</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                    >
                        We believe the best learning happens when students teach students. Our platform connects
                        learners with peer mentors who've walked the same path, creating a supportive environment
                        where knowledge flows naturally.
                    </motion.p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="group relative p-8 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/40 hover:border-primary-300/50 shadow-lg shadow-gray-200/30 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300"
                        >
                            <div className="flex items-start gap-5">
                                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Secure Payments Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative p-10 rounded-3xl bg-gradient-to-r from-primary-600/90 via-primary-700/90 to-primary-800/90 backdrop-blur-xl text-white overflow-hidden border border-white/10 shadow-2xl"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-6">
                        <motion.div
                            whileHover={{ rotate: 10, scale: 1.1 }}
                            className="p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-sm border border-white/10"
                        >
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </motion.div>

                        <h3 className="text-2xl md:text-4xl font-black mb-2">
                            Secure Payments with Escrow Protection
                        </h3>

                        <p className="text-lg md:text-xl text-primary-50 leading-relaxed max-w-3xl">
                            Your peace of mind is our priority. We use a secure <span className="font-bold text-white">Escrow Payment System</span> to hold your funds safely until your session is successfully completed.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full text-left">
                            {[
                                { color: 'bg-emerald-400', title: 'Funds Held Safely', desc: 'Payment is released to the provider only after the session is done.' },
                                { color: 'bg-amber-400', title: 'No-Show Protection', desc: 'Full refund guaranteed if the provider doesn\'t show up for the session.' },
                                { color: 'bg-blue-400', title: 'Verified Sessions', desc: 'Both parties confirm completion before funds are transferred.' }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    className="bg-white/10 p-5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors"
                                >
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                                        {item.title}
                                    </h4>
                                    <p className="text-sm text-primary-100">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Message Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="mt-16 text-center p-8 rounded-2xl bg-white/40 backdrop-blur-lg border border-white/50 shadow-lg"
                >
                    <p className="text-xl text-gray-600 italic max-w-3xl mx-auto leading-relaxed">
                        "Peer-to-peer learning isn't just about sharing knowledge—it's about building a community
                        where every student has the potential to be both a learner and a teacher."
                    </p>
                    <p className="mt-4 text-primary-600 font-semibold">— The SkillShare Team</p>
                </motion.div>
            </div>
        </section>
    );
};

export default AboutSection;
