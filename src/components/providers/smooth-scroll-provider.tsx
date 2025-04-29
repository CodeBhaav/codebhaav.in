"use client"

import type React from "react"
import { createContext, type ReactNode } from "react"
import { ReactLenis, useLenis } from 'lenis/react'
import type Lenis from "lenis"

interface SmoothScrollContextType {
    lenis: Lenis | null
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
    lenis: null,
})

export function SmoothScrollProvider({ children }: { children: ReactNode }) {

    return <ReactLenis root>{children}</ReactLenis>
}

export function useSmoothScroll(scrollRef: React.RefObject<HTMLElement>) {
    const lenis = useLenis(({ scroll }) => {
        // called every scroll

    })



    return lenis
}
