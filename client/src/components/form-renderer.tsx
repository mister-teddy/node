import React from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export interface FormFieldConfig<T = any> {
  name: keyof T;
  label: string;
  type: "text" | "number" | "toggle" | "email" | "password";
  required?: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | true;
  };
}

export interface FormRendererProps<T extends Record<string, any> = Record<string, any>> {
  fields: FormFieldConfig<T>[];
  onSubmit: (values: T) => Promise<true | Error>;
  submitButtonProps?: {
    children?: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
  };
  defaultValues?: Partial<T>;
  className?: string;
}

// Helper to create Zod schema dynamically based on field configs
function createZodSchema(fields: FormFieldConfig[]) {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "email":
      case "password":
        fieldSchema = z.string();
        if (field.type === "email") {
          fieldSchema = (fieldSchema as z.ZodString).email("Please enter a valid email address");
        }
        if (field.validation?.min) {
          fieldSchema = (fieldSchema as z.ZodString).min(field.validation.min, `Must be at least ${field.validation.min} characters`);
        }
        if (field.validation?.max) {
          fieldSchema = (fieldSchema as z.ZodString).max(field.validation.max, `Must be at most ${field.validation.max} characters`);
        }
        if (field.validation?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(field.validation.pattern, "Please enter a valid format");
        }
        break;
      case "number":
        fieldSchema = z.coerce.number();
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min, `Must be at least ${field.validation.min}`);
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max, `Must be at most ${field.validation.max}`);
        }
        break;
      case "toggle":
        fieldSchema = z.boolean();
        break;
      default:
        fieldSchema = z.string();
    }

    if (field.validation?.custom) {
      fieldSchema = fieldSchema.refine(
        field.validation.custom,
        { message: "Invalid value" }
      );
    }

    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[field.name as string] = fieldSchema;
  });

  return z.object(schemaObject);
}

export default function FormRenderer<T extends Record<string, any> = Record<string, any>>({
  fields,
  onSubmit,
  submitButtonProps = {},
  defaultValues,
  className,
}: FormRendererProps<T>) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const schema = React.useMemo(() => createZodSchema(fields), [fields]);

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: (defaultValues || {}) as any,
  });

  const handleSubmit = async (values: FieldValues) => {
    setIsSubmitting(true);

    try {
      // Transform number fields from string to number if needed
      const transformedValues = { ...values };
      fields.forEach((field) => {
        if (field.type === "number" && typeof transformedValues[field.name as string] === "string") {
          const numValue = parseFloat(transformedValues[field.name as string] as string);
          if (!isNaN(numValue)) {
            transformedValues[field.name as string] = numValue;
          }
        }
      });

      const result = await onSubmit(transformedValues as T);

      if (result instanceof Error) {
        toast.error(result.message);
      } else {
        toast.success("Form submitted successfully");
        form.reset();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormFieldConfig<T>) => {
    return (
      <FormField
        key={field.name as string}
        control={form.control}
        name={field.name as any}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              {field.type === "toggle" ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                    disabled={isSubmitting}
                  />
                  {field.description && (
                    <span className="text-sm text-muted-foreground">
                      {field.description}
                    </span>
                  )}
                </div>
              ) : (
                <Input
                  {...formField}
                  type={field.type === "number" ? "number" : field.type}
                  placeholder={field.placeholder}
                  disabled={isSubmitting}
                  value={formField.value ?? ""}
                  onChange={(e) => {
                    const value = field.type === "number"
                      ? e.target.valueAsNumber || e.target.value
                      : e.target.value;
                    formField.onChange(value);
                  }}
                />
              )}
            </FormControl>
            {field.description && field.type !== "toggle" && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const {
    children = "Submit",
    variant = "default",
    size = "default",
    className: buttonClassName,
    ...restButtonProps
  } = submitButtonProps;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={`space-y-6 ${className || ""}`}
      >
        <div className="space-y-4">
          {fields.map(renderField)}
        </div>

        <Button
          type="submit"
          variant={variant}
          size={size}
          disabled={isSubmitting}
          className={buttonClassName}
          {...restButtonProps}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {children}
        </Button>
      </form>
    </Form>
  );
}