"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date" | "datetime-local";
  className?: string;
}

export function FormInput({ id, label, value, onChange, placeholder, type = "text", className = "" }: FormInputProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="label-form">{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-apple"
      />
    </div>
  );
}

interface FormTextareaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function FormTextarea({ id, label, value, onChange, placeholder, rows = 3, className = "" }: FormTextareaProps) {
  return (
    <div className={className}>
      {label && <Label htmlFor={id} className="label-form">{label}</Label>}
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input-apple resize-y"
        style={{ minHeight: "100px" }}
      />
    </div>
  );
}

interface FormSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export function FormSelect({ id, label, value, onChange, options, placeholder, className = "" }: FormSelectProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="label-form">{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-apple select-apple"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, children, className = "" }: FormSectionProps) {
  return (
    <section className={`section-form ${className}`}>
      <h2 className="text-xl font-semibold text-foreground mb-4" style={{ letterSpacing: "-0.3px" }}>{title}</h2>
      {children}
    </section>
  );
}

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ children, className = "" }: FormRowProps) {
  return <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${className}`}>{children}</div>;
}

interface VitalSignsInputProps {
  mach: string;
  nhietdo: string;
  ha_tren: string;
  ha_duoi: string;
  nhiptho: string;
  onChange: (field: string, value: string) => void;
}

export function VitalSignsInput({ mach, nhietdo, ha_tren, ha_duoi, nhiptho, onChange }: VitalSignsInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm">Mạch</span>
        <Input
          type="number"
          value={mach}
          onChange={(e) => onChange("mach", e.target.value)}
          className="w-20 input-apple"
        />
        <span className="text-sm">lần/phút</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm">Nhiệt độ</span>
        <Input
          type="number"
          step="0.1"
          value={nhietdo}
          onChange={(e) => onChange("nhietdo", e.target.value)}
          className="w-20 input-apple"
        />
        <span className="text-sm">°C</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm">Huyết áp</span>
        <Input
          type="number"
          value={ha_tren}
          onChange={(e) => onChange("ha_tren", e.target.value)}
          className="w-20 input-apple"
          placeholder="120"
        />
        <span className="text-sm">/</span>
        <Input
          type="number"
          value={ha_duoi}
          onChange={(e) => onChange("ha_duoi", e.target.value)}
          className="w-20 input-apple"
          placeholder="80"
        />
        <span className="text-sm">mmHg</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm">Nhịp thở</span>
        <Input
          type="number"
          value={nhiptho}
          onChange={(e) => onChange("nhiptho", e.target.value)}
          className="w-20 input-apple"
        />
        <span className="text-sm">lần/phút</span>
      </div>
    </div>
  );
}

interface BMICalculatorProps {
  chieucao: string;
  cannang: string;
  bmi: string;
  phanloai: string;
  onChange: (field: string, value: string) => void;
}

export function BMICalculator({ chieucao, cannang, bmi, phanloai, onChange }: BMICalculatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-sm">Chiều cao:</span>
      <Input
        type="number"
        value={chieucao}
        onChange={(e) => onChange("chieucao", e.target.value)}
        className="w-20 input-apple"
      />
      <span className="text-sm">cm</span>
      <span className="text-sm">cân nặng:</span>
      <Input
        type="number"
        value={cannang}
        onChange={(e) => onChange("cannang", e.target.value)}
        className="w-20 input-apple"
      />
      <span className="text-sm">kg</span>
      <span className="text-sm">BMI =</span>
      <span className="font-medium text-foreground">{bmi}</span>
      <span className="text-sm">kg/m²</span>
      <span className="text-sm">⇒ Phân loại</span>
      <span className="font-medium text-foreground">{phanloai}</span>
      <span className="text-sm text-muted-foreground">theo WHO Asia</span>
    </div>
  );
}
