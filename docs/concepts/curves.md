# Curves

A Curve maps an input domain to a property value.

For FRNL state animation, every Curve uses a canonical one-second domain:

0.0s ---------------- 1.0s

The Curve itself has no playback duration.

## Phase interpretation

For a finite Attack or Release phase, the phase duration remaps the one-second Curve domain.

A 0.5 second phase compresses the Curve into 0.5 seconds. A 2 second phase stretches it across 2 seconds.

Conceptually: normalizedTime = elapsedPhaseTime / phaseDuration

Sustain repeatedly evaluates the Curve over its one-second domain.
