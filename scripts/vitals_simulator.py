import asyncio
import random
import httpx
from datetime import datetime, timedelta

class VitalsSimulator:
    """Simulate continuous vitals streaming for testing"""
    
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        self.encounter_id = 1
        
    def generate_normal_vitals(self):
        """Generate physiologically normal vitals"""
        return {
            "heart_rate": random.gauss(75, 10),
            "systolic_bp": random.gauss(120, 10),
            "diastolic_bp": random.gauss(80, 8),
            "mean_arterial_pressure": random.gauss(85, 10),
            "respiratory_rate": random.gauss(16, 3),
            "spo2": random.gauss(97, 2),
            "temperature": random.gauss(37.0, 0.3)
        }
    
    def generate_deteriorating_vitals(self, severity: float = 0.5):
        """Generate deteriorating vitals (0=normal, 1=critical)"""
        base = self.generate_normal_vitals()
        
        # Simulate sepsis pattern
        base["heart_rate"] += severity * 40  # Tachycardia
        base["respiratory_rate"] += severity * 10  # Tachypnea
        base["temperature"] += severity * 2  # Fever
        base["mean_arterial_pressure"] -= severity * 20  # Hypotension
        base["spo2"] -= severity * 5  # Hypoxemia
        
        return base
    
    async def stream_vitals(self, duration_minutes: int = 60, deteriorate: bool = False):
        """Stream vitals for specified duration"""
        async with httpx.AsyncClient() as client:
            start_time = datetime.now()
            iteration = 0
            
            while (datetime.now() - start_time).total_seconds() < duration_minutes * 60:
                iteration += 1
                
                # Calculate deterioration if enabled
                severity = 0
                if deteriorate:
                    # Gradually increase severity over time
                    progress = (datetime.now() - start_time).total_seconds() / (duration_minutes * 60)
                    severity = min(progress * 1.5, 1.0)
                
                # Generate vitals
                if deteriorate:
                    vitals = self.generate_deteriorating_vitals(severity)
                else:
                    vitals = self.generate_normal_vitals()
                
                vitals["timestamp"] = datetime.now().isoformat()
                vitals["encounter_id"] = self.encounter_id
                
                # Send to API
                try:
                    response = await client.post(
                        f"{self.api_url}/api/vitals",
                        json=vitals
                    )
                    status = "✓" if response.status_code == 200 else "✗"
                    print(f"{status} [{iteration}] HR:{vitals['heart_rate']:.0f} MAP:{vitals['mean_arterial_pressure']:.0f} RR:{vitals['respiratory_rate']:.0f} SpO2:{vitals['spo2']:.1f}%")
                except Exception as e:
                    print(f"✗ Error sending vitals: {e}")
                
                # Wait 30 seconds before next reading
                await asyncio.sleep(30)

async def main():
    print("Clinical Vitals Simulator")
    print("=" * 50)
    print("1. Normal vitals stream (stable patient)")
    print("2. Deteriorating vitals stream (sepsis pattern)")
    
    choice = input("\nSelect option (1 or 2): ").strip()
    duration = int(input("Duration in minutes (default 60): ").strip() or "60")
    
    simulator = VitalsSimulator()
    
    if choice == "2":
        print(f"\n🚨 Simulating deteriorating patient for {duration} minutes...")
        await simulator.stream_vitals(duration, deteriorate=True)
    else:
        print(f"\n✓ Simulating stable patient for {duration} minutes...")
        await simulator.stream_vitals(duration, deteriorate=False)

if __name__ == "__main__":
    asyncio.run(main())
