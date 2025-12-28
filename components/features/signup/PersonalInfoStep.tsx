import React from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import styles from "./PersonalInfoStep.module.css";

export interface PersonalInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PersonalInfoStepProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<PersonalInfoFormData>;
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  register,
  errors,
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Personal Information</h2>
      <p className={styles.subtitle}>Let's start with your basic details</p>
      
      <div className={styles.fields}>
        <Input
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          required
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          required
          error={errors.lastName?.message}
          {...register("lastName")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email address"
          required
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="09123456789 or +639123456789"
          required
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>
    </div>
  );
};

