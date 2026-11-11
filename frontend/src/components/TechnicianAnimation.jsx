
import { useEffect, useState } from 'react';

import cylinder from '../assets/animations/gasconnect-cylinder.png';

// Walking frames
import frame1 from '../assets/animations/technician-frame-1.png';
import frame2 from '../assets/animations/technician-frame-2.png';
import frame3 from '../assets/animations/technician-frame-3.png';
import frame4 from '../assets/animations/technician-frame-4.png';
import frame5 from '../assets/animations/technician-frame-5.png';
import frame6 from '../assets/animations/technician-frame-6.png';

// Peeking frames
import peek1 from '../assets/animations/technician-peek-frame-1.png';
import peek2 from '../assets/animations/technician-peek-frame-2.png';
import peek3 from '../assets/animations/technician-peek-frame-3.png';
import peek4 from '../assets/animations/technician-peek-frame-4.png';

import './TechnicianAnimation.css';

const walkingFrames = [
    frame1, frame2, frame3,
    frame4, frame5, frame6
];

// Forward and backward peeking sequence
const peekingFrames = [
    peek1,
    peek2,
    peek3,
    peek4,
    peek3,
    peek2,
    peek1
];

function TechnicianAnimation() {
    const [phase, setPhase] = useState('peeking');

    const [peekIndex, setPeekIndex] = useState(0);
    const [walkIndex, setWalkIndex] = useState(0);

// Stage 1: Peeking animation
useEffect(() => {
    if (phase !== 'peeking') return;

    let step = 0;

    const interval = setInterval(() => {
        if (step < peekingFrames.length - 1) {
            step++;
            setPeekIndex(step);
        } else {
            clearInterval(interval);
            setPeekIndex(0);
            setPhase('walking');
        }
    }, 1180);

    return () => clearInterval(interval);
}, [phase]);

// Stage 2: Walking animation
useEffect(() => {
    if (phase !== 'walking') return;

    let step = 0;

    const frameInterval = setInterval(() => {
        step++;
        setWalkIndex(step % walkingFrames.length);
    }, 160);

    // Walk for 5 seconds, then return to peeking
    const phaseTimeout = setTimeout(() => {
        clearInterval(frameInterval);
        setWalkIndex(0);
        setPeekIndex(0);
        setPhase('peeking');
    }, 20000);

    return () => {
        clearInterval(frameInterval);
        clearTimeout(phaseTimeout);
    };
}, [phase]);

    return (
        <div className="technician-scene">

            {/* Stationary LPG Cylinder */}
            <img
                src={cylinder}
                alt="GasConnect LPG Cylinder"
                className="animation-cylinder"
            />

            {/* Stage 1: Left-side peeking */}
            {phase === 'peeking' && (
                <img
                    src={peekingFrames[peekIndex]}
                    alt="Technician peeking"
                    className="technician-peeker"
                />
            )}

            {/* Stage 2: Walking */}
            {phase === 'walking' && (
                <div className="technician-walker">
                    <img
                        src={walkingFrames[walkIndex]}
                        alt="GasConnect Service Technician"
                        className="technician-character"
                    />
                </div>
            )}

        </div>
    );
}

export default TechnicianAnimation;
