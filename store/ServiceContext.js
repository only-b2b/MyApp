import React, { createContext, useContext, useState } from "react";

const ServiceContext = createContext();

export function ServiceProvider({ children }) {
  // values: "carwash" | "pickdrop" | "driver" | null
  const [selectedService, setSelectedService] = useState(null);

  return (
    <ServiceContext.Provider value={{ selectedService, setSelectedService }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  return useContext(ServiceContext);
}
