# 3D Modeling Process & Experimental Path

This document outlines the systematic construction of the three models used in this project. All models were developed following an experimental path to explore different aspects of 3D geometry and web integration.

## Model 1: Water Bottle (The Foundation)
**Goal:** Master basic cylindrical geometry and transparency.
1. **Mesh Creation:** Started with a Cylinder primitive in Blender.
2. **Loop Cuts:** Added loop cuts to define the neck and base.
3. **Extrusion:** Extruded the top face to create the bottle mouth.
4. **Threading:** Used the "Screw" modifier to create a realistic cap thread.
5. **Shading:** Applied a Glass BSDF shader with a high IOR (Index of Refraction) to simulate plastic/water interaction.

## Model 2: Soda Can (Intermediate UV Mapping)
**Goal:** Explore high-fidelity texturing and PBR (Physically Based Rendering) materials.
1. **Mesh Creation:** Created a cylinder with specific proportions of a standard 330ml can.
2. **Beveling:** Added bevels to the top and bottom rims for realism.
3. **UV Unwrapping:** Performed a "Cylinder Projection" unwrap to create a clean surface for the brand label.
4. **Texturing:** Created a custom 2K texture map in Photoshop/GIMP to simulate the "MyBrand" labeling.
5. **Animation:** Rigged the pull-tab with a simple bone to allow for an "Open" animation.

## Model 3: Crushed Can (Advanced Mesh Deformation)
**Goal:** Demonstrate complex topology and shape manipulation.
1. **Base Mesh:** Sourced from the Soda Can model to maintain consistency.
2. **Physics Simulation:** Used Blender's "Cloth Simulation" with pressure and collision to simulate the crushing effect.
3. **Sculpting:** Refined the crushed edges using the "Grab" and "Crease" brushes in Sculpt Mode to ensure no mesh self-intersection.
4. **Topology Optimization:** Applied a Decimate modifier to reduce the poly count for web performance while retaining the crushed silhouette.

---
**Technical Note:** All models were exported as `.glb` (glTF Binary) to ensure all textures, animations, and materials are bundled in a single file for optimal web loading.
