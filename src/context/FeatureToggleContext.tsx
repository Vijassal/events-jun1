import React, { createContext, useContext, useState, useEffect } from 'react';

type FeatureToggleContextType = {
  religionEnabled: boolean;
  setReligionEnabled: (enabled: boolean) => void;
  floorplanEnabled: boolean;
  setFloorplanEnabled: (enabled: boolean) => void;
};

const FeatureToggleContext = createContext<FeatureToggleContextType>({
  religionEnabled: true,
  setReligionEnabled: () => {},
  floorplanEnabled: true,
  setFloorplanEnabled: () => {},
});

export const FeatureToggleProvider = ({ children }: { children: React.ReactNode }) => {
  const [religionEnabled, setReligionEnabled] = useState(true);
  const [floorplanEnabled, setFloorplanEnabled] = useState(true);

  useEffect(() => {
    const religion = localStorage.getItem('religionEnabled');
    const floorplan = localStorage.getItem('floorplanEnabled');
    if (religion !== null) setReligionEnabled(religion === 'true');
    if (floorplan !== null) setFloorplanEnabled(floorplan === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('religionEnabled', religionEnabled.toString());
  }, [religionEnabled]);

  useEffect(() => {
    localStorage.setItem('floorplanEnabled', floorplanEnabled.toString());
  }, [floorplanEnabled]);

  return (
    <FeatureToggleContext.Provider value={{ religionEnabled, setReligionEnabled, floorplanEnabled, setFloorplanEnabled }}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

export const useFeatureToggle = () => useContext(FeatureToggleContext); 