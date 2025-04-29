"use client"

import { motion, useInView } from "motion/react"
import { useRef } from "react"
import Image from "next/image"
import { Users } from "lucide-react"
import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Placeholder team members for future use
const futureMemberPlaceholders = [
    {
        role: "Lead Developer",
        description: "Responsible for technical architecture and development standards",
    },
    {
        role: "UI/UX Designer",
        description: "Creates intuitive and accessible user experiences",
    },
    {
        role: "Community Manager",
        description: "Fosters engagement and supports community members",
    },
    {
        role: "Content Creator",
        description: "Produces educational content and documentation",
    },
]

export function TeamSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    return (
        <section
            id="team"
            ref={ref}
            className="relative min-h-screen flex items-center py-16 md:py-24 bg-muted/30 overflow-hidden"
        >
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] bg-gradient-to-tr from-teal-500/5 to-emerald-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl mx-auto text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Team</h2>
                    <p className="text-lg text-muted-foreground">
                        CodeBhaav is just getting started, and we&#39;re looking for passionate individuals to help shape this
                        community.
                    </p>
                </motion.div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="order-2 lg:order-1"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {futureMemberPlaceholders.map((member, index) => (
                                    <motion.div
                                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                                        className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 z-0" />
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-background/50 border border-primary/20 flex items-center justify-center mb-3">
                                                <span className="text-xl font-bold text-primary">?</span>
                                            </div>
                                            <h3 className="text-lg font-bold mb-1">{member.role}</h3>
                                            <p className="text-sm text-muted-foreground">{member.description}</p>
                                            <div className="mt-3 text-xs text-primary">Position Open</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                transition={{ duration: 0.5, delay: 0.9 }}
                                className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/30 border border-primary/10 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 md:col-span-2">
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 z-0" />
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                            <Users className="w-5 h-5 text-primary" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2">Could this be you?</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            We&#39;re looking for passionate individuals who believe in our mission and want to help build this
                                            community.
                                        </p>
                                        <HideAssistantOnHover>
                                            <Link href="/founding-member">
                                                <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-sm">
                                                    Apply to Join
                                                </Button>
                                            </Link>
                                        </HideAssistantOnHover>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="order-1 lg:order-2"
                        >
                            <div className="relative">
                                <div className="relative aspect-square  overflow-hidden rounded-2xl">
                                    <Image
                                        src="/team.jpeg?height=600&width=800"
                                        alt="Join Our Team"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

                                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                            <Users className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Be Part of Something Authentic</h3>
                                        <p className="text-muted-foreground mb-6">
                                            We&#39;re building a community where self-taught developers, career-switchers, and tech enthusiasts
                                            can find genuine support. No matter your background or experience level, if you&#39;re passionate
                                            about building real solutions and helping others grow, there&#39;s a place for you here.
                                        </p>
                                        <div className="flex flex-wrap gap-4 justify-end">
                                            <HideAssistantOnHover>
                                                <Link href="/founding-member">
                                                    <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                                                        Become a Founding Member
                                                    </Button>
                                                </Link>
                                            </HideAssistantOnHover>
                                            <HideAssistantOnHover>
                                                <Link href="/mission">
                                                    <Button variant="outline" className="border-primary/20 backdrop-blur-sm bg-background/30">
                                                        Learn More
                                                    </Button>
                                                </Link>
                                            </HideAssistantOnHover>
                                        </div>
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5, delay: 0.7 }}
                                    className="absolute -bottom-6 -left-6 bg-primary/10 backdrop-blur-md rounded-lg p-4 border border-primary/20 hidden md:block"
                                >
                                    <p className="text-sm font-medium">Join a team of</p>
                                    <p className="text-2xl font-bold">Passionate Builders</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}
