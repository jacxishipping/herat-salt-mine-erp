using System;
using System.Collections.Generic;
using System.Linq;
using HeratSaltErp.Models;

namespace HeratSaltErp.Services;

public sealed record GradeCostProfile(
    double ExtractionAfnPerMt,
    double ProcessingIodineAfnPerMt,
    double PackagingBagsAfnPerMt,
    double StandardListPriceAfnPerMt
);

public sealed class PriceQuote
{
    public double ExtractionCostAfn { get; init; }
    public double ProcessingCostAfn { get; init; }
    public double PackagingCostAfn { get; init; }
    public double MompRoyaltyAfn { get; init; } = 350;
    public double TransportCostAfn { get; init; }
    public double LandedCostPerMtAfn => ExtractionCostAfn + ProcessingCostAfn + PackagingCostAfn + MompRoyaltyAfn + TransportCostAfn;
    public double VolumeDiscountPct { get; init; }
    public double TargetMarginPct { get; init; }
    public double FinalUnitPriceAfn { get; init; }
    public double FinalUnitPriceUsd { get; init; }
    public double TotalOrderAfn { get; init; }
    public double TotalOrderUsd { get; init; }
    public double EstimatedProfitAfn { get; init; }
    public string PricingSource { get; init; } = "Cost-Plus";
}

public static class PricingEngineService
{
    public const double MompRoyaltyPerMtAfn = 350.0;

    public static readonly Dictionary<string, GradeCostProfile> GradeProfiles = new()
    {
        ["INDUSTRIAL_RAW_ROCK"]   = new(1150, 0,    0,    3200),
        ["DEICING_CHEMICAL"]      = new(1200, 250,  150,  3600),
        ["LIVESTOCK_SALT_BLOCK"]  = new(1300, 950,  450,  5400),
        ["REFINED_IODIZED_50KG"]  = new(1420, 1450, 620,  6500),
        ["REFINED_IODIZED_25KG"]  = new(1420, 1500, 780,  6800),
        ["REFINED_IODIZED_1KG"]   = new(1420, 1750, 1400, 8400)
    };

    public static readonly Dictionary<string, double> DestinationFreightAfnPerMt = new()
    {
        ["HERAT_LOCAL"]       = 450,
        ["DOMESTIC_PROVINCE"] = 1250,
        ["ISLAM_QALA_EXPORT"] = 950,
        ["TORGHUNDI_EXPORT"]  = 1100
    };

    public static double GetVolumeDiscountPct(double quantityMt) => quantityMt switch
    {
        >= 500 => 8.0,
        >= 100 => 5.0,
        >= 50  => 2.5,
        _      => 0.0
    };

    public static PriceQuote CalculateQuote(
        string customerName,
        string saltGrade,
        string destination,
        double quantityMt,
        double targetMarginPct,
        double usdToAfn,
        IEnumerable<TonnageContract> activeContracts,
        double mompRoyaltyPerMt = MompRoyaltyPerMtAfn)
    {
        var profile = GradeProfiles.TryGetValue(saltGrade, out var p)
            ? p
            : GradeProfiles["REFINED_IODIZED_25KG"];
        var freight = DestinationFreightAfnPerMt.TryGetValue(destination, out var f) ? f : 450;
        double royaltyRate = mompRoyaltyPerMt > 0 ? mompRoyaltyPerMt : MompRoyaltyPerMtAfn;

        double landedCost = profile.ExtractionAfnPerMt
            + profile.ProcessingIodineAfnPerMt
            + profile.PackagingBagsAfnPerMt
            + royaltyRate
            + freight;

        double discountPct = GetVolumeDiscountPct(quantityMt);

        // Check for an active customer contract for this salt grade
        var contract = activeContracts.FirstOrDefault(c =>
            c.CustomerName.Equals(customerName.Trim(), StringComparison.OrdinalIgnoreCase) &&
            c.SaltGrade == saltGrade);

        double unitPriceAfn;
        string source;

        if (contract is not null)
        {
            unitPriceAfn = Math.Round(contract.TierPriceAfnPerMt * (1.0 - discountPct / 100.0), 0);
            source = $"Contract {contract.ContractCode}" + (discountPct > 0 ? $" (-{discountPct}% vol)" : "");
        }
        else
        {
            // Cost-Plus pricing using target margin %, floored at grade list price if margin is 0
            double costPlus = landedCost * (1.0 + Math.Max(0, targetMarginPct) / 100.0);
            double discounted = costPlus * (1.0 - discountPct / 100.0);
            unitPriceAfn = Math.Round(discounted, 0);
            source = $"Cost-Plus ({targetMarginPct:F0}% margin" + (discountPct > 0 ? $", -{discountPct}% vol)" : ")");
        }

        double fx = usdToAfn > 0 ? usdToAfn : 71.50;
        double qty = Math.Max(0, quantityMt);
        double totalAfn = Math.Round(unitPriceAfn * qty, 0);
        double profitAfn = Math.Round((unitPriceAfn - landedCost) * qty, 0);

        return new PriceQuote
        {
            ExtractionCostAfn = profile.ExtractionAfnPerMt,
            ProcessingCostAfn = profile.ProcessingIodineAfnPerMt,
            PackagingCostAfn = profile.PackagingBagsAfnPerMt,
            MompRoyaltyAfn = royaltyRate,
            TransportCostAfn = freight,
            VolumeDiscountPct = discountPct,
            TargetMarginPct = targetMarginPct,
            FinalUnitPriceAfn = unitPriceAfn,
            FinalUnitPriceUsd = Math.Round(unitPriceAfn / fx, 2),
            TotalOrderAfn = totalAfn,
            TotalOrderUsd = Math.Round(totalAfn / fx, 2),
            EstimatedProfitAfn = profitAfn,
            PricingSource = source
        };
    }
}
