"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const apiKeySchema = z.object({
  name: z.string().min(1, "Description is required"),
})

type ApiKeyFormData = z.infer<typeof apiKeySchema>

interface ApiKeyFormProps {
  onSubmit: (data: ApiKeyFormData) => Promise<string>
  isLoading?: boolean
}

export function ApiKeyForm({ onSubmit, isLoading }: ApiKeyFormProps) {
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
    },
  })

  const handleSubmit = async (data: ApiKeyFormData) => {
    setShowConfirmDialog(true)
  }

  const handleConfirm = async () => {
    const data = form.getValues()
    const key = await onSubmit(data)
    setGeneratedKey(key)
    setShowConfirmDialog(false)
    form.reset()
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="API key description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate Key"}
          </Button>
        </form>
      </Form>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate a new API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!generatedKey} onOpenChange={() => setGeneratedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Generated</DialogTitle>
            <DialogDescription>Please copy this key now. You won't be able to see it again.</DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-md">
            <code className="text-sm break-all">{generatedKey}</code>
          </div>
          <DialogFooter>
            <Button onClick={() => setGeneratedKey(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
