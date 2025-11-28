"""
FİYATLANDIRMA MOTORU
Excel tarife yapısındaki hesaplama modellerini çalıştırır
"""

from typing import Dict, Any, Optional
from decimal import Decimal
import math

from .models import CalculationType


class PricingEngine:
    """
    Fiyatlandırma motoru - Excel formüllerini çalıştırır
    
    Kullanım:
        engine = PricingEngine()
        price = engine.calculate(
            calculation_type=CalculationType.PER_BLOCK,
            base_price=Decimal("80.00"),
            formula_params={"base_weight_ton": 3, "base_time_min": 30},
            input_data={"weight": 5, "minutes": 45}
        )
    """
    
    @staticmethod
    def calculate(
        calculation_type: CalculationType,
        base_price: Decimal,
        formula_params: Optional[Dict[str, Any]],
        input_data: Dict[str, Any],
        currency: str = "USD"
    ) -> Dict[str, Any]:
        """
        Fiyat hesaplama
        
        Args:
            calculation_type: Hesaplama tipi (CalculationType enum)
            base_price: Baz fiyat (Decimal)
            formula_params: JSON hesaplama parametreleri
            input_data: Kullanıcıdan gelen veriler
                {
                    "quantity": 5,       # Adet
                    "weight": 500,       # KG
                    "days": 3,           # Gün sayısı
                    "minutes": 450,      # Dakika
                    "hours": 7.5,        # Saat
                    "grt": 5000,         # Gross Registered Tonnage
                    "sqmeter": 25        # Metrekare
                }
            currency: Para birimi (USD, TRY, EUR)
        
        Returns:
            {
                "subtotal": Decimal,           # Ara toplam
                "calculation_details": str,    # Hesaplama açıklaması
                "breakdown": dict,             # Detaylı kırılım
                "currency": str
            }
        """
        
        if formula_params is None:
            formula_params = {}
        
        # Hesaplama tipine göre işlem
        if calculation_type == CalculationType.FIXED:
            return PricingEngine._calculate_fixed(base_price, input_data, currency)
        
        elif calculation_type == CalculationType.PER_UNIT:
            return PricingEngine._calculate_per_unit(base_price, formula_params, input_data, currency)
        
        elif calculation_type == CalculationType.X_SECONDARY:
            return PricingEngine._calculate_x_secondary(base_price, formula_params, input_data, currency)
        
        elif calculation_type == CalculationType.PER_BLOCK:
            return PricingEngine._calculate_per_block(base_price, formula_params, input_data, currency)
        
        elif calculation_type == CalculationType.BASE_PLUS_INCREMENT:
            return PricingEngine._calculate_base_plus_increment(base_price, formula_params, input_data, currency)
        
        elif calculation_type == CalculationType.VEHICLE_4H_RULE:
            return PricingEngine._calculate_vehicle_4h_rule(base_price, formula_params, input_data, currency)
        
        else:
            raise ValueError(f"Unknown calculation type: {calculation_type}")
    
    # ========== HESAPLAMA METODLARı ==========
    
    @staticmethod
    def _calculate_fixed(
        base_price: Decimal,
        input_data: Dict[str, Any],
        currency: str
    ) -> Dict[str, Any]:
        """Sabit ücret - miktar fark etmez"""
        return {
            "subtotal": base_price,
            "calculation_details": f"Sabit ücret: {base_price} {currency}",
            "breakdown": {
                "base_price": float(base_price)
            },
            "currency": currency
        }
    
    @staticmethod
    def _calculate_per_unit(
        base_price: Decimal,
        formula_params: Dict[str, Any],
        input_data: Dict[str, Any],
        currency: str
    ) -> Dict[str, Any]:
        """Birim başı çarpma: fiyat × miktar"""
        quantity = Decimal(str(input_data.get("quantity", 1)))
        subtotal = base_price * quantity
        
        return {
            "subtotal": subtotal,
            "calculation_details": f"{base_price} {currency} × {quantity} adet = {subtotal} {currency}",
            "breakdown": {
                "base_price": float(base_price),
                "quantity": float(quantity),
                "unit": formula_params.get("unit", "ADET")
            },
            "currency": currency
        }
    
    @staticmethod
    def _calculate_x_secondary(
        base_price: Decimal,
        formula_params: Dict[str, Any],
        input_data: Dict[str, Any],
        currency: str
    ) -> Dict[str, Any]:
        """
        İki boyutlu hesaplama
        Örnek: Ardiye - 0.03 USD × KG × GÜN
        """
        primary_field = formula_params.get("primary_field", "weight")
        secondary_field = formula_params.get("secondary_field", "days")
        
        primary_value = Decimal(str(input_data.get(primary_field, 0)))
        secondary_value = Decimal(str(input_data.get(secondary_field, 1)))
        
        # Yuvarla (ceil ise)
        if formula_params.get("secondary_rounding") == "ceil":
            secondary_value = Decimal(math.ceil(float(secondary_value)))
        
        subtotal = base_price * primary_value * secondary_value
        
        return {
            "subtotal": subtotal,
            "calculation_details": f"{base_price} {currency} × {primary_value} {primary_field} × {secondary_value} {secondary_field} = {subtotal} {currency}",
            "breakdown": {
                "base_price": float(base_price),
                "primary_value": float(primary_value),
                "primary_field": primary_field,
                "secondary_value": float(secondary_value),
                "secondary_field": secondary_field
            },
            "currency": currency
        }
    
    @staticmethod
    def _calculate_per_block(
        base_price: Decimal,
        formula_params: Dict[str, Any],
        input_data: Dict[str, Any],
        currency: str
    ) -> Dict[str, Any]:
        """
        Blok bazlı hesaplama
        Örnek: Forklift - 80 USD × (weight/3) × ceil(minutes/30)
        """
        weight = Decimal(str(input_data.get("weight", 0)))
        minutes = Decimal(str(input_data.get("minutes", 0)))
        
        base_weight = Decimal(str(formula_params.get("base_weight_ton", 3)))
        base_time = Decimal(str(formula_params.get("base_time_min", 30)))
        
        # Ağırlık bloğu (örn: 5 ton / 3 ton = 1.67)
        weight_blocks = weight / base_weight if base_weight > 0 else Decimal(1)
        
        # Zaman bloğu (yukarı yuvarla: 45 dk / 30 dk = 2 blok)
        time_blocks = Decimal(math.ceil(float(minutes / base_time))) if base_time > 0 else Decimal(1)
        
        subtotal = base_price * weight_blocks * time_blocks
        
        return {
            "subtotal": subtotal,
            "calculation_details": f"{base_price} {currency} × ({weight}/{base_weight} ton) × ceil({minutes}/{base_time} dk) = {subtotal} {currency}",
            "breakdown": {
                "base_price": float(base_price),
                "weight": float(weight),
                "weight_blocks": float(weight_blocks),
                "minutes": float(minutes),
                "time_blocks": float(time_blocks),
                "base_weight_ton": float(base_weight),
                "base_time_min": float(base_time)
            },
            "currency": currency
        }
    
    @staticmethod
    def _calculate_base_plus_increment(
        base_price: Decimal,
        formula_params: Dict[str, Any],
        input_data: Dict[str, Any],
        currency: str
    ) -> Dict[str, Any]:
        """
        Baz fiyat + artış oranı
        Örnek: Liman Kullanım Ücreti - 950 USD + (GRT × 0.03)
        """
        increment_unit = formula_params.get("increment_unit", "GRT")
        increment_rate = Decimal(str(formula_params.get("increment_rate", 0)))
        
        unit_value = Decimal(str(input_data.get(increment_unit.lower(), 0)))
        
        increment_amount = unit_value * increment_rate
        subtotal = base_price + increment_amount
        
        return {
            "subtotal": subtotal,
            "calculation_details": f"{base_price} {currency} + ({unit_value} {increment_unit} × {increment_rate}) = {subtotal} {currency}",
            "breakdown": {
                "base_price": float(base_price),
                "increment_unit": increment_unit,
                "unit_value": float(unit_value),
                "increment_rate": float(increment_rate),
                "increment_amount": float(increment_amount)
            },
            "currency": currency
        }
    
    @staticmethod
    def _calculate_vehicle_4h_rule(
        base_price: Decimal,
        formula_params: Dict[str, Any],
        input_data: Dict[str, Any],
        currency: str
    ) -> Dict[str, Any]:
        """
        Araç giriş 4 saat kuralı
        - İlk 240 dakika: Baz fiyat (kesin)
        - 240 dakikayı aşan kısım: Dakika başı ek ücret
        
        Örnek:
        - Baz: 15 USD (240 dakika kesin)
        - Kalış: 450 dakika
        - Aşan: 450 - 240 = 210 dakika
        - Dakika ücreti: 15 / 240 = 0.0625 USD/dk
        - Ek ücret: 210 × 0.0625 = 13.125 USD
        - Toplam: 15 + 13.125 = 28.125 USD
        """
        minutes = Decimal(str(input_data.get("minutes", 0)))
        base_minutes = Decimal(str(formula_params.get("base_minutes", 240)))
        
        # İlk 4 saat kesin
        if minutes <= base_minutes:
            return {
                "subtotal": base_price,
                "calculation_details": f"4 saat içinde: {base_price} {currency} (kesin ücret)",
                "breakdown": {
                    "base_price": float(base_price),
                    "minutes": float(minutes),
                    "base_minutes": float(base_minutes),
                    "extra_minutes": 0,
                    "extra_charge": 0
                },
                "currency": currency
            }
        
        # 4 saati aşan kısım
        extra_minutes = minutes - base_minutes
        minute_rate = base_price / base_minutes  # Dakika başı ücret
        extra_charge = extra_minutes * minute_rate
        subtotal = base_price + extra_charge
        
        return {
            "subtotal": subtotal,
            "calculation_details": f"4 saat kesin: {base_price} {currency} + Ek {extra_minutes} dk × {minute_rate:.4f} {currency}/dk = {subtotal} {currency}",
            "breakdown": {
                "base_price": float(base_price),
                "minutes": float(minutes),
                "base_minutes": float(base_minutes),
                "extra_minutes": float(extra_minutes),
                "minute_rate": float(minute_rate),
                "extra_charge": float(extra_charge)
            },
            "currency": currency
        }


# Kullanım Örneği
if __name__ == "__main__":
    engine = PricingEngine()
    
    # Örnek 1: Forklift (PER_BLOCK)
    result = engine.calculate(
        calculation_type=CalculationType.PER_BLOCK,
        base_price=Decimal("80.00"),
        formula_params={"base_weight_ton": 3, "base_time_min": 30},
        input_data={"weight": 5, "minutes": 45},
        currency="USD"
    )
    print("Forklift:", result)
    
    # Örnek 2: Araç Giriş (VEHICLE_4H_RULE)
    result = engine.calculate(
        calculation_type=CalculationType.VEHICLE_4H_RULE,
        base_price=Decimal("15.00"),
        formula_params={"base_minutes": 240},
        input_data={"minutes": 450},
        currency="USD"
    )
    print("Araç Giriş:", result)
