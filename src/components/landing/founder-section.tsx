"use client"

import { motion } from "motion/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { HideAssistantOnHover } from "@/components/providers/hide-assistant-on-hover"

export function FounderSection() {
    return (
        <section className="relative py-24 md:py-32 bg-background">
            <div className="container px-4">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl mx-auto text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">My Story</h2>
                    <p className="text-lg text-muted-foreground">The journey behind CodeBhaav and why it matters.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="relative aspect-square overflow-hidden rounded-2xl">
                            <Image src="https://github.com/pranav-bhatkar.png" alt="Founder" fill className="object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="absolute -bottom-6 -right-6 bg-primary/10 backdrop-blur-md rounded-lg p-4 border border-primary/20"
                        >
                            <p className="text-sm font-medium">Self-taught Developer</p>
                            <p className="text-2xl font-bold">Building with Purpose</p>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <h3 className="text-2xl font-bold mb-4">🎙️ CodeBhaav – My Story</h3>
                        <div className="space-y-2 text-muted-foreground mb-8">
                            <p>
                                I’m from Amravati – a tier-3 city where dreams don’t come with user manuals. Started as an office boy,
                                got into tech because I knew how to handle a computer. No IIT tag, no course certificate – just jugad,
                                YouTube, and midnight debugging. I built real-world things, learned by doing, and figured out one thing
                                — there are many like me, but no proper place for us.
                            </p>
                            <p className="font-medium text-primary">🧠 What is CodeBhaav?</p>
                            <p>
                                CodeBhaav is that place. Not a startup, not a course, not a hype machine. Just a space to build, learn,
                                and share — in raw, desi dev style. Yes, I want it to grow. Maybe make something out of it. But it’ll
                                always stay rooted in real value — no bakchodi, no gatekeeping. If you’re also from small towns and big
                                dreams — you’ll feel right at home here.
                            </p>
                        </div>
                        <HideAssistantOnHover>
                            <Button className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                                Join the Journey
                            </Button>
                        </HideAssistantOnHover>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
