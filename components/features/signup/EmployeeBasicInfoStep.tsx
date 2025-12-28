"use client";

import React, { useEffect, useState } from "react";
import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import styles from "./EmployeeBasicInfoStep.module.css";

export interface EmployeeBasicInfoFormData {
  employeeNumber: string;
  hireType: "DIRECT_HIRE" | "AGENCY" | "";
  companyId: string;
}

export interface EmployeeBasicInfoStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<EmployeeBasicInfoFormData>;
  watch: UseFormWatch<any>;
  setValue: (name: string, value: any) => void;
}

interface Company {
  id: string;
  name: string;
  type: "COMPANY" | "AGENCY";
}

// Default company/agency list (will be replaced by admin management in future)
const DEFAULT_COMPANIES: Company[] = [
  // Companies (Direct Hire)
  { id: "ab-leisure", name: "AB Leisure Exponent Inc.", type: "COMPANY" },
  { id: "allpoint-leisure", name: "Allpoint Leisure Corporation", type: "COMPANY" },
  { id: "alpha-one", name: "Alpha One Amusement and Recreation Corp.", type: "COMPANY" },
  { id: "big-time-gaming", name: "Big Time Gaming Corporation", type: "COMPANY" },
  { id: "bingo-extravaganza", name: "Bingo Extravaganza Inc.", type: "COMPANY" },
  { id: "bingo-palace", name: "Bingo Palace Corporation", type: "COMPANY" },
  { id: "first-leisure", name: "First Leisure And Game Co. Inc.", type: "COMPANY" },
  { id: "grand-polaris", name: "Grand Polaris Gaming Co., Inc.", type: "COMPANY" },
  { id: "highland-gaming", name: "Highland Gaming Corporation", type: "COMPANY" },
  { id: "iloilo-bingo", name: "Iloilo Bingo Corporation", type: "COMPANY" },
  { id: "isarog-gaming", name: "Isarog Gaming Corporation", type: "COMPANY" },
  { id: "manila-bingo", name: "Manila Bingo Corporation", type: "COMPANY" },
  { id: "metro-gaming", name: "Metro Gaming Entertainment Gallery Inc.", type: "COMPANY" },
  { id: "negrense-entertainment", name: "Negrense Entertainment Gallery inc.", type: "COMPANY" },
  { id: "one-bingo-pavilion", name: "One Bingo Pavilion Inc.", type: "COMPANY" },
  { id: "one-bingo-place", name: "One Bingo Place Inc.", type: "COMPANY" },
  { id: "rizal-gaming", name: "Rizal Gaming Corporation", type: "COMPANY" },
  { id: "sg-amusement", name: "SG Amusement And Recreation Corp.", type: "COMPANY" },
  { id: "south-bingo", name: "South Bingo Corporation", type: "COMPANY" },
  { id: "south-entertainment", name: "South Entertainment Gallery Incorporated", type: "COMPANY" },
  { id: "summit-bingo", name: "Summit Bingo Inc.", type: "COMPANY" },
  { id: "topmost-gaming", name: "Topmost Gaming Corporation", type: "COMPANY" },
  { id: "topnotch-bingo", name: "Topnotch Bingo Trend Inc.", type: "COMPANY" },
  { id: "total-gamezone", name: "Total Gamezone Xtreme Incorporated", type: "COMPANY" },
  // Agencies
  { id: "aglipay-security", name: "Aglipay Security Agency", type: "AGENCY" },
  { id: "consult-asia", name: "Consult Asia Business Solutions and ADvisory Services Inc.", type: "AGENCY" },
  { id: "globalink-employment", name: "Globalink Employment Services Inc.", type: "AGENCY" },
  { id: "gamexperience-employment", name: "Gamexperience Employment Services Inc.", type: "AGENCY" },
  { id: "greatwall-manpower", name: "Greatwall Manpower And General Services Inc.", type: "AGENCY" },
  { id: "growvite-staffing", name: "Growvite Staffing Services Inc.", type: "AGENCY" },
  { id: "merit-security", name: "Merit Security Agency", type: "AGENCY" },
  { id: "one-merit-global", name: "One Merit Global Security Investigation Agency", type: "AGENCY" },
  { id: "sehwani-manpower", name: "Sehwani Manpower Corporation, International", type: "AGENCY" },
  { id: "serendipity-cooperative", name: "Serendipity Multi Purpose Cooperative", type: "AGENCY" },
  { id: "smart-career", name: "Smart Career Outsourcing Services Co.", type: "AGENCY" },
  { id: "steadfast-services", name: "Steadfast Services Cooperative", type: "AGENCY" },
  { id: "sunrise-security", name: "Sunrise Security Services Inc.", type: "AGENCY" },
  { id: "ultimate-templar", name: "Ultimate Templar Manpower & Allied Services Inc.", type: "AGENCY" },
];

export const EmployeeBasicInfoStep: React.FC<EmployeeBasicInfoStepProps> = ({
  register,
  errors,
  watch,
  setValue,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  
  const hireType = watch("hireType");

  // Fetch companies on mount - MUST use database data, not hardcoded defaults
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingCompanies(true);
      setCompaniesError(null);

      try {
        const companiesRes = await fetch("/api/companies");
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          // Only use API data - never use hardcoded defaults
          if (companiesData.data && companiesData.data.length > 0) {
            setCompanies(companiesData.data);
          } else {
            setCompaniesError("No companies available. Please run: npm run db:seed");
            setCompanies([]);
          }
        } else {
          setCompaniesError("Failed to load companies. Please ensure the database is seeded.");
          setCompanies([]);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompaniesError("Failed to load companies. Please check your connection.");
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    fetchData();
  }, []);

  // Filter companies based on hire type
  const filteredCompanies = hireType
    ? companies.filter((company) => {
        if (hireType === "DIRECT_HIRE") {
          return company.type === "COMPANY";
        } else if (hireType === "AGENCY") {
          return company.type === "AGENCY";
        }
        return true;
      })
    : companies;

  // Reset company selection when hire type changes
  useEffect(() => {
    if (hireType) {
      setValue("companyId", "");
    }
  }, [hireType, setValue]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Employee Information</h2>
      <p className={styles.subtitle}>Basic employment details</p>

      <div className={styles.fields}>
        <Input
          label="Employee Number"
          type="text"
          placeholder="Enter your employee number"
          required
          {...register("employeeNumber")}
        />

        <Select
          label="Hire Type"
          required
          {...register("hireType", {
            required: "Please select a hire type",
          })}
        >
          <option value="">Select Hire Type</option>
          <option value="DIRECT_HIRE">Direct Hire</option>
          <option value="AGENCY">Agency</option>
        </Select>

        {companiesError ? (
          <div className={styles.errorText}>
            {companiesError}
          </div>
        ) : (
          <Select
            label="Company/Agency"
            required
            disabled={!hireType || isLoadingCompanies || companies.length === 0}
            {...register("companyId", {
              required: "Please select a company or agency",
            })}
          >
            <option value="">Select {hireType === "DIRECT_HIRE" ? "Company" : hireType === "AGENCY" ? "Agency" : "Company/Agency"}</option>
            {filteredCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        )}
      </div>
    </div>
  );
};

