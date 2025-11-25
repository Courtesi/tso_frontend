import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

interface ParticlesContextType {
	init: boolean;
}

const ParticlesContext = createContext<ParticlesContextType>({ init: false });

export const ParticlesProvider = ({ children }: { children: ReactNode }) => {
	const [init, setInit] = useState(false);

	useEffect(() => {
		initParticlesEngine(async (engine: Engine) => {
			await loadSlim(engine);
		}).then(() => {
			setInit(true);
		});
	}, []);

	return (
		<ParticlesContext.Provider value={{ init }}>
			{children}
		</ParticlesContext.Provider>
	);
};

export const useParticles = () => useContext(ParticlesContext);
