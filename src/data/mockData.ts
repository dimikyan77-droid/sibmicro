export interface Product {
  id: string;
  partNumber: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  description: string;
  frequency?: string;
  gain?: string;
  noiseFigure?: string;
  supplyVoltage?: string;
  package: string;
  powerOutput?: string;
  temperatureRange: string;
  rohs: boolean;
  stock: number;
  leadTime: string;
  priceTiers: { qty: number; price: number }[];
  moq: number;
  datasheetUrl: string;
  crossReferences?: string[];
  image?: string;
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
  subcategories: { name: string; slug: string; count: number }[];
}

export interface Manufacturer {
  name: string;
  slug: string;
  logo?: string;
  description: string;
  productCount: number;
  featured: string[];
}

export const categories: Category[] = [
  {
    name: "Semiconductors",
    slug: "semiconductors",
    icon: "Cpu",
    subcategories: [
      { name: "RF Amplifiers", slug: "rf-amplifiers", count: 2450 },
      { name: "RF Mixers", slug: "rf-mixers", count: 890 },
      { name: "RF Switches", slug: "rf-switches", count: 1230 },
      { name: "ADC / DAC", slug: "adc-dac", count: 3100 },
      { name: "Microcontrollers", slug: "microcontrollers", count: 8900 },
      { name: "Power Management ICs", slug: "power-management", count: 12500 },
    ],
  },
  {
    name: "Passive Components",
    slug: "passive-components",
    icon: "CircuitBoard",
    subcategories: [
      { name: "Capacitors", slug: "capacitors", count: 45000 },
      { name: "Resistors", slug: "resistors", count: 62000 },
      { name: "Inductors", slug: "inductors", count: 18000 },
      { name: "Ferrite Beads", slug: "ferrite-beads", count: 5200 },
    ],
  },
  {
    name: "RF & Microwave",
    slug: "rf-microwave",
    icon: "Radio",
    subcategories: [
      { name: "Power Amplifiers", slug: "power-amplifiers", count: 1800 },
      { name: "LNAs", slug: "lnas", count: 960 },
      { name: "Attenuators", slug: "attenuators", count: 2100 },
      { name: "RF Modules", slug: "rf-modules", count: 3400 },
      { name: "Filters", slug: "filters", count: 4500 },
    ],
  },
  {
    name: "Connectors",
    slug: "connectors",
    icon: "Cable",
    subcategories: [
      { name: "RF Connectors", slug: "rf-connectors", count: 8900 },
      { name: "Board-to-Board", slug: "board-to-board", count: 15000 },
      { name: "Wire-to-Board", slug: "wire-to-board", count: 22000 },
    ],
  },
  {
    name: "Test & Measurement",
    slug: "test-measurement",
    icon: "Gauge",
    subcategories: [
      { name: "Oscilloscope Probes", slug: "oscilloscope-probes", count: 340 },
      { name: "Signal Generators", slug: "signal-generators", count: 120 },
      { name: "Spectrum Analyzers", slug: "spectrum-analyzers", count: 85 },
    ],
  },
  {
    name: "Optoelectronics",
    slug: "optoelectronics",
    icon: "Lightbulb",
    subcategories: [
      { name: "LEDs", slug: "leds", count: 35000 },
      { name: "Photodiodes", slug: "photodiodes", count: 4200 },
      { name: "Laser Diodes", slug: "laser-diodes", count: 1800 },
    ],
  },
];

export const manufacturers: Manufacturer[] = [
  {
    name: "Analog Devices",
    slug: "analog-devices",
    description: "Analog Devices is a global leader in the design and manufacturing of analog, mixed-signal, and DSP integrated circuits.",
    productCount: 45000,
    featured: ["HMC8205", "ADRV9009", "AD9361"],
  },
  {
    name: "Qorvo",
    slug: "qorvo",
    description: "Qorvo provides innovative RF solutions for mobile, infrastructure, and defense applications.",
    productCount: 12000,
    featured: ["QPA2628", "QPF4528", "TGA2595"],
  },
  {
    name: "Skyworks Solutions",
    slug: "skyworks",
    description: "Skyworks Solutions is innovating the way people connect with semiconductors for automotive, broadband, and more.",
    productCount: 8500,
    featured: ["SKY66174", "SKY13370", "SE5003L"],
  },
  {
    name: "Texas Instruments",
    slug: "texas-instruments",
    description: "Texas Instruments designs and manufactures semiconductors and various integrated circuits.",
    productCount: 80000,
    featured: ["TPS65218", "LMK04828", "ADS1256"],
  },
  {
    name: "NXP Semiconductors",
    slug: "nxp",
    description: "NXP provides high-performance mixed-signal and standard product solutions.",
    productCount: 35000,
    featured: ["MKW41Z", "i.MX8M", "S32K144"],
  },
  {
    name: "Infineon Technologies",
    slug: "infineon",
    description: "Infineon Technologies offers semiconductor solutions for energy efficiency, mobility, and IoT.",
    productCount: 28000,
    featured: ["IRFP4568", "TLE9842", "CY8C6347"],
  },
];

export const products: Product[] = [
  {
    id: "1",
    partNumber: "HMC8205BF10",
    manufacturer: "Analog Devices",
    category: "Semiconductors",
    subcategory: "RF Amplifiers",
    description: "GaN MMIC Power Amplifier, 2-20 GHz, 6W, 20 dB Gain",
    frequency: "2 - 20 GHz",
    gain: "20 dB",
    noiseFigure: "5 dB",
    supplyVoltage: "28V",
    package: "10-Lead Flatpack",
    powerOutput: "6W",
    temperatureRange: "-40°C to +85°C",
    rohs: true,
    stock: 245,
    leadTime: "12 weeks",
    priceTiers: [
      { qty: 1, price: 485.0 },
      { qty: 10, price: 425.0 },
      { qty: 25, price: 395.0 },
      { qty: 100, price: 365.0 },
    ],
    moq: 1,
    datasheetUrl: "#",
    crossReferences: ["TGA2595-SM", "QPM1002"],
  },
  {
    id: "2",
    partNumber: "QPA2628",
    manufacturer: "Qorvo",
    category: "RF & Microwave",
    subcategory: "Power Amplifiers",
    description: "GaN Power Amplifier, 27.5-31 GHz, 4W, 5G mmWave",
    frequency: "27.5 - 31 GHz",
    gain: "22 dB",
    noiseFigure: "6 dB",
    supplyVoltage: "5V",
    package: "QFN-24",
    powerOutput: "4W",
    temperatureRange: "-40°C to +105°C",
    rohs: true,
    stock: 1280,
    leadTime: "8 weeks",
    priceTiers: [
      { qty: 1, price: 32.5 },
      { qty: 100, price: 28.0 },
      { qty: 500, price: 24.5 },
      { qty: 1000, price: 21.0 },
    ],
    moq: 1,
    datasheetUrl: "#",
    crossReferences: ["HMC7054"],
  },
  {
    id: "3",
    partNumber: "AD9361BBCZ",
    manufacturer: "Analog Devices",
    category: "Semiconductors",
    subcategory: "ADC / DAC",
    description: "RF Agile Transceiver, 70 MHz to 6 GHz, 2x2 MIMO",
    frequency: "70 MHz - 6 GHz",
    gain: "Variable",
    supplyVoltage: "1.3V / 3.3V",
    package: "LFBGA-144",
    temperatureRange: "-40°C to +85°C",
    rohs: true,
    stock: 89,
    leadTime: "16 weeks",
    priceTiers: [
      { qty: 1, price: 285.0 },
      { qty: 10, price: 265.0 },
      { qty: 50, price: 245.0 },
    ],
    moq: 1,
    datasheetUrl: "#",
    crossReferences: ["MAX2871", "LMS7002M"],
  },
  {
    id: "4",
    partNumber: "SKY13370-374LF",
    manufacturer: "Skyworks Solutions",
    category: "Semiconductors",
    subcategory: "RF Switches",
    description: "0.1-6.0 GHz GaAs pHEMT SPDT Switch, 0.3 dB Insertion Loss",
    frequency: "0.1 - 6 GHz",
    gain: "-0.3 dB (IL)",
    supplyVoltage: "3.3V",
    package: "QFN-6",
    temperatureRange: "-40°C to +105°C",
    rohs: true,
    stock: 15200,
    leadTime: "In Stock",
    priceTiers: [
      { qty: 1, price: 2.85 },
      { qty: 100, price: 1.95 },
      { qty: 1000, price: 1.45 },
      { qty: 5000, price: 1.15 },
    ],
    moq: 1,
    datasheetUrl: "#",
    crossReferences: ["PE42520", "HMC349AMS8G"],
  },
  {
    id: "5",
    partNumber: "TPS65218DBTR",
    manufacturer: "Texas Instruments",
    category: "Semiconductors",
    subcategory: "Power Management ICs",
    description: "Power Management IC for ARM Cortex-A8/A9, Multi-Rail PMIC",
    supplyVoltage: "2.4V - 5.5V",
    package: "VQFN-48",
    temperatureRange: "-40°C to +105°C",
    rohs: true,
    stock: 4500,
    leadTime: "In Stock",
    priceTiers: [
      { qty: 1, price: 4.25 },
      { qty: 100, price: 3.65 },
      { qty: 1000, price: 3.15 },
      { qty: 5000, price: 2.85 },
    ],
    moq: 1,
    datasheetUrl: "#",
  },
  {
    id: "6",
    partNumber: "GRM155R71C104KA88D",
    manufacturer: "Murata",
    category: "Passive Components",
    subcategory: "Capacitors",
    description: "0402 100nF ±10% 16V X7R MLCC Capacitor",
    supplyVoltage: "16V (rated)",
    package: "0402 (1005 metric)",
    temperatureRange: "-55°C to +125°C",
    rohs: true,
    stock: 892000,
    leadTime: "In Stock",
    priceTiers: [
      { qty: 1, price: 0.01 },
      { qty: 100, price: 0.005 },
      { qty: 1000, price: 0.003 },
      { qty: 10000, price: 0.002 },
    ],
    moq: 10,
    datasheetUrl: "#",
    crossReferences: ["CL05B104KO5NNNC", "CC0402KRX7R7BB104"],
  },
  {
    id: "7",
    partNumber: "CRCW040210K0FKED",
    manufacturer: "Vishay",
    category: "Passive Components",
    subcategory: "Resistors",
    description: "0402 10kΩ ±1% 1/16W Thick Film Resistor",
    supplyVoltage: "50V (max)",
    package: "0402 (1005 metric)",
    temperatureRange: "-55°C to +155°C",
    rohs: true,
    stock: 1500000,
    leadTime: "In Stock",
    priceTiers: [
      { qty: 1, price: 0.008 },
      { qty: 100, price: 0.004 },
      { qty: 1000, price: 0.002 },
      { qty: 10000, price: 0.0015 },
    ],
    moq: 10,
    datasheetUrl: "#",
  },
  {
    id: "8",
    partNumber: "TGA2595-SM",
    manufacturer: "Qorvo",
    category: "RF & Microwave",
    subcategory: "Power Amplifiers",
    description: "GaN Power Amplifier, 2-18 GHz, 8W Saturated Output Power",
    frequency: "2 - 18 GHz",
    gain: "18 dB",
    noiseFigure: "5.5 dB",
    supplyVoltage: "28V",
    package: "5x5mm QFN",
    powerOutput: "8W",
    temperatureRange: "-40°C to +85°C",
    rohs: true,
    stock: 340,
    leadTime: "10 weeks",
    priceTiers: [
      { qty: 1, price: 320.0 },
      { qty: 10, price: 290.0 },
      { qty: 25, price: 270.0 },
    ],
    moq: 1,
    datasheetUrl: "#",
    crossReferences: ["HMC8205BF10"],
  },
  {
    id: "9",
    partNumber: "LMK04828BISQ",
    manufacturer: "Texas Instruments",
    category: "Semiconductors",
    subcategory: "ADC / DAC",
    description: "Ultra-Low Jitter Clock Generator with JESD204B, Dual PLL",
    frequency: "DC - 3.1 GHz",
    supplyVoltage: "3.3V",
    package: "WQFN-64",
    temperatureRange: "-40°C to +85°C",
    rohs: true,
    stock: 620,
    leadTime: "6 weeks",
    priceTiers: [
      { qty: 1, price: 42.0 },
      { qty: 25, price: 38.5 },
      { qty: 100, price: 35.0 },
    ],
    moq: 1,
    datasheetUrl: "#",
  },
  {
    id: "10",
    partNumber: "PE42520MLAA-Z",
    manufacturer: "pSemi",
    category: "Semiconductors",
    subcategory: "RF Switches",
    description: "UltraCMOS SP4T RF Switch, DC-60 GHz, 1.3 dB IL",
    frequency: "DC - 60 GHz",
    gain: "-1.3 dB (IL)",
    supplyVoltage: "3.3V",
    package: "QFN-16",
    temperatureRange: "-40°C to +105°C",
    rohs: true,
    stock: 8900,
    leadTime: "In Stock",
    priceTiers: [
      { qty: 1, price: 8.5 },
      { qty: 100, price: 6.25 },
      { qty: 1000, price: 4.85 },
    ],
    moq: 1,
    datasheetUrl: "#",
    crossReferences: ["HMC344ALC3B", "SKY13370-374LF"],
  },
];
