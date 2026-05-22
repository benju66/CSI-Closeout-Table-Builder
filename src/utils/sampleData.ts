export interface SampleSpec {
  title: string;
  csiCode: string;
  sectionName: string;
  textContent: string;
}

export const SAMPLE_SPECS: SampleSpec[] = [
  {
    title: "Section 23 09 23 - HVAC Direct Digital Control (DDC) Systems",
    csiCode: "23 09 23",
    sectionName: "Direct Digital Control (DDC) Systems for HVAC",
    textContent: `SECTION 23 09 23 - DIRECT DIGITAL CONTROL SYSTEMS FOR HVAC

PART 3 - EXECUTION

3.5 DEMONSTRATION AND TRAINING
A. The system contractor shall conduct a complete demonstration of the HVAC system functions for the Owner's commissioning agent and operations staff. Ensure all sequence of operations are triggered, verified, and logged in real-time under simulated seasonal loads.
B. Provide three (3) separate 8-hour days of hands-on, on-site classroom instruction for up to six (6) of the Owner's facilities engineers.
C. Instruction shall be led by a factory-certified instructor and must cover:
   1. Daily system startup and shutdown overrides.
   2. Building automation schedule adjustment and custom holiday calendars.
   3. Modifying temperature and airflow setpoint parameters.
   4. Calibrating dampeners and electronic valves.
   5. Diagnosing active alarms and scheduling historic run-time maintenance logs.
D. The contractor shall supply professionally recorded and indexed high-definition training videos on a USB external drive, along with six (6) copies of the physical Operations & Maintenance (O&M) manuals. Include certificates of completion for all attendees.
`
  },
  {
    title: "Section 26 24 16 - Under-voltage Switchboards & Electrical distribution",
    csiCode: "26 24 16",
    sectionName: "Switchboards",
    textContent: `SECTION 26 24 16 - SWITCHBOARDS AND PANELBOARDS

PART 3 - EXECUTION

3.4 FIELD TRAINING AND MANUFACTURER DEMONSTRATION
A. Engage a factory-authorized service representative to train Owner's maintenance personnel to adjust, operate, and maintain switchboard components, transient voltage surge suppressors, and tri-phase power meters.
B. Training schedule shall consist of a minimum of two (2) separate sessions:
   1. Session 1: Classroom instruction (4 hours) covering protective relay parameters, breakers coordination, ARC flash safety clearances, and digital power readings.
   2. Session 2: Hands-on field demonstration (2 hours) explaining safe lock-out/tag-out procedures, drawer-out breaker racking, fuse changeout, and manual transfer configurations.
C. Training sessions must be scheduled with the Engineer and Owner's Representative at least 14 days in advance. Provide interactive training materials, circuit diagrams, and digital templates to standard procedures.
`
  },
  {
    title: "Section 08 71 00 - Door Hardware & Security Access Control",
    csiCode: "08 71 00",
    sectionName: "Door Hardware",
    textContent: `SECTION 08 71 00 - DOOR HARDWARE AND ACCESS CONTROL SYSTEM

PART 3 - EXECUTION

3.7 INSTRUCTION AND DEMONSTRATION
A. The Hardware contractor, in conjunction with the access control manufacturer, shall provide a fully qualified expert to instruct Owner's locksmiths and security team of the operation of the locking mechanisms and electronic strikes.
B. Training shall include a complete review of:
   1. Interfacing panic exit bars with building fire alarm release loops.
   2. Programming smart cards, keycards, and biometric readers.
   3. Troubleshooting battery back-up indicators and magnetic lock failsafes.
   4. Safe keyway re-pinning procedures and key system nesting hierarchies.
C. A minimum of four (4) hours of dedicated instruction is required. The Contractor shall record the instruction on high-definition video and deliver a copy to the Owner within 5 days of completion of training.
`
  }
];
