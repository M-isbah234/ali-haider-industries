import { updateLoomCache, updateAmbientCache, updateSolarCache, LoomState } from './index';
// import { OPCUAClient, AttributeIds } from 'node-opcua'; // Scaffolded for future
import ModbusRTU from 'modbus-serial'; 
import { ServerTCP } from 'modbus-serial';
// Helper to generate a baseline mock state for a loom
const createMockState = (loom_number: number): LoomState => ({
  loom_number,
  status: 'RUNNING',
  rpm: 600 + Math.floor(Math.random() * 200),
  total_picks: Math.floor(Math.random() * 1000000),
  total_meters: Math.floor(Math.random() * 10000),
  efficiency: 85 + (Math.random() * 10),
  warp_stops_daily: Math.floor(Math.random() * 5),
  filling_stops_daily: Math.floor(Math.random() * 5)
});

// Cache holding the current mocked states to persist values between ticks
const mockLoomStates: Map<number, LoomState> = new Map();
for (let i = 1; i <= 36; i++) {
  mockLoomStates.set(i, createMockState(i));
}

// Function to mutate a loom state (simulating real machine changes)
function mutateLoomState(loom: LoomState) {
  if (Math.random() < 0.002) { // Random chance to stop
    if (loom.status === 'RUNNING') {
      const stops = ['STOPPED_WARP', 'STOPPED_FILLING', 'STOPPED_MANUAL'] as const;
      loom.status = stops[Math.floor(Math.random() * stops.length)];
      loom.rpm = 0;
      if (loom.status === 'STOPPED_WARP') loom.warp_stops_daily++;
      if (loom.status === 'STOPPED_FILLING') loom.filling_stops_daily++;
    } else {
      loom.status = 'RUNNING';
    }
  }

  if (loom.status === 'RUNNING') {
    loom.rpm = 600 + Math.floor(Math.random() * 200);
    loom.total_picks += Math.floor(loom.rpm / 60);
    loom.total_meters += (loom.rpm / 60) * 0.001;
    loom.efficiency = loom.efficiency + (0.1 * (95 - loom.efficiency) * Math.random());
  } else {
    loom.efficiency = Math.max(0, loom.efficiency - 0.05);
  }
  return loom;
}

/**
 * 🚀 LOOP 1: HIGH-SPEED OPC UA POLLING (Modern Looms 1-18)
 * Simulates low-latency Ethernet communication with Picanol BlueBox machines.
 */
async function startModernLoomsLoop() {
  console.log('[OPC UA] Starting high-speed polling for Looms 1-18 (BlueBox)...');
  
  // Scaffolded instantiation for future integration:
  // const opcClient = OPCUAClient.create({ 
  //    endpointMustExist: false,
  //    securityMode: MessageSecurityMode.SignAndEncrypt, // Ready for Picanol's cert requirements
  //    securityPolicy: SecurityPolicy.Basic256Sha256
  // });
  // await opcClient.connect("opc.tcp://factory-lan:4840");
  
  // CRITICAL: We MUST reuse a single persistent session across reads to prevent deadlock.
  // const opcSession = await opcClient.createSession();

  setInterval(async () => {
    try {
      // In production (reusing the persistent opcSession): 
      // const data = await opcSession.read({ nodeId: "ns=2;s=Loom1_RPM" });
      
      for (let i = 1; i <= 18; i++) {
        const state = mockLoomStates.get(i)!;
        mutateLoomState(state);
        updateLoomCache({ ...state });
      }
    } catch (err) {
      console.error('[OPC UA] Polling error:', err);
    }
  }, 200); // 200ms fast tick
}

/**
 * 🐌 LOOP 2: SLOWER MODBUS RTU POLLING (Legacy Looms 19-36)
 * Simulates RS-485 serial-to-ethernet polling with built-in latency and timeouts.
 * Isolated so that serial hang-ups do NOT block the OPC UA high-speed stream.
 */
async function startLegacyLoomsLoop() {
  console.log('[MODBUS] Starting timeout-safe polling for Looms 19-36 (Legacy)...');
  
  // Scaffolded instantiation:
  // const modbusClient = new ModbusRTU();
  // 
  // For physical RS-485 via USB (requires 'serialport' native dependency on deployment machine):
  // await modbusClient.connectRTUBuffered("/dev/ttyUSB0", { baudRate: 9600 });
  // 
  // Or for Serial-to-Ethernet converters:
  // await modbusClient.connectTCP("192.168.1.50", { port: 502 });
  // 
  // modbusClient.setTimeout(500); // Crucial to prevent blocking

  // Using a self-calling async function instead of setInterval to wait for slow reads
  async function poll() {
    try {
      // Simulate network/serial delay for RS-485
      const delay = 50 + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulate a serial timeout (hang) 1% of the time
      if (Math.random() < 0.01) {
        throw new Error("Modbus RTU Timeout: Gateway did not respond in 500ms");
      }

      for (let i = 19; i <= 36; i++) {
        const state = mockLoomStates.get(i)!;
        mutateLoomState(state);
        updateLoomCache({ ...state });
      }
    } catch (err: any) {
      console.warn(`[MODBUS WARN] ${err.message}. Retrying next cycle...`);
    } finally {
      // Wait before next cycle
      setTimeout(poll, 1000); 
    }
  }

  poll();
}

/**
 * ☀️ LOOP 3: AMBIENT & SOLAR POLLING
 * Simulates reading Huawei SUN2000 Modbus TCP and environmental sensors.
 */
async function startAmbientAndSolarLoop() {
  console.log('[SOLAR] Starting Huawei SUN2000 Mock Modbus Server on port 6607...');
  
  // 1. Define the Mock Modbus Server (Simulating the Huawei Dongle)
  const vector = {
    getInputRegister: function(addr: number, unitID: number) {
      const hour = new Date().getHours();
      
      // Calculate current generation (parabolic curve)
      let generationKw = 0;
      if (hour > 6 && hour < 19) {
        const peak = 220; 
        const mid = 12.5;
        generationKw = Math.max(0, peak - (Math.pow(hour - mid, 2) * 6)) + (Math.random() * 10);
      }
      
      const dailyYieldKwh = (hour > 6 ? (hour - 6) * 100 : 0) + generationKw;

      if (addr === 32064) {
        // Huawei register for Input Power (32-bit integer, usually W). We'll scale KW to W.
        // For simplicity in our 16-bit vector, returning kW directly for the mock,
        // but in real life we'd split a 32-bit int across two 16-bit registers.
        return Math.floor(generationKw);
      }
      if (addr === 32114) {
        // Huawei register for Daily Yield (32-bit, scaled by 100)
        return Math.floor(dailyYieldKwh * 100);
      }
      return 0;
    }
  };

  // Start the server
  const mockServer = new ServerTCP(vector, { host: "0.0.0.0", port: 6607, debug: false, unitID: 1 });

  // 2. Define the Client that polls the server
  const solarClient = new ModbusRTU();
  
  // Wait a moment for server to bind
  await new Promise(resolve => setTimeout(resolve, 500));
  await solarClient.connectTCP("127.0.0.1", { port: 6607 });
  console.log('[SOLAR] Edge Gateway successfully connected to mock Huawei Modbus server.');

  setInterval(async () => {
    // A. Ambient Sensors (Mocked purely in memory)
    // 2% chance to drop pressure below critical 5.5 threshold for alert simulation
    const isPressureDrop = Math.random() < 0.02;
    const airPressure = isPressureDrop ? 5.2 + (Math.random() * 0.2) : 6.8 + (Math.random() * 0.4);

    updateAmbientCache({
      main_air_pressure_bar: airPressure,
      hall_temperature_celsius: 28 + (Math.random() * 2),
      hall_humidity_percentage: 65 + (Math.random() * 5)
    });

    // B. Solar Polling via Local Modbus TCP
    try {
      // Read Input Power
      const powerData = await solarClient.readInputRegisters(32064, 1);
      const generationKw = powerData.data[0];

      // Read Daily Yield
      const yieldData = await solarClient.readInputRegisters(32114, 1);
      const dailyYieldKwh = yieldData.data[0] / 100;

      updateSolarCache({
        current_generation_kw: generationKw,
        daily_yield_kwh: dailyYieldKwh
      });
    } catch (err) {
      console.error('[SOLAR] Modbus read error:', err);
    }

  }, 2000); // 2-second tick for non-critical solar data
}

export function startDeviceDrivers() {
  startModernLoomsLoop();
  startLegacyLoomsLoop();
  startAmbientAndSolarLoop();
}
