import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { DOCS_URL } from "@/web/config/config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button, buttonVariants } from "@workspace/ui/components/button";

export default function Component() {
  return (
    <div className="max-w-5xl w-full text-left mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-medium text-foreground mb-2 leading-tight tracking-tight mt-8">
            Why Cronicorn
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl">
            More building. Less scheduling.

          </p>
        </div>
        <Link to="/login" className={buttonVariants({ size: "lg" })}>
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>

      {/* Code Blocks Section */}
      <div className="grid grid-cols-1">
        <Accordion
          type="single"
          collapsible
          className="w-full"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Product Information</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Our flagship product combines cutting-edge technology with sleek
                design. Built with premium materials, it offers unparalleled
                performance and reliability.
              </p>
              <p>
                Key features include advanced processing capabilities, and an
                intuitive user interface designed for both beginners and experts.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Shipping Details</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                We offer worldwide shipping through trusted courier partners.
                Standard delivery takes 3-5 business days, while express shipping
                ensures delivery within 1-2 business days.
              </p>
              <p>
                All orders are carefully packaged and fully insured. Track your
                shipment in real-time through our dedicated tracking portal.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Return Policy</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                We stand behind our products with a comprehensive 30-day return
                policy. If you&apos;re not completely satisfied, simply return the
                item in its original condition.
              </p>
              <p>
                Our hassle-free return process includes free return shipping and
                full refunds processed within 48 hours of receiving the returned
                item.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Left Code Block */}
        {/* <div className="space-y-2">
          <JsonCodeBlock jsonString={JSON.stringify(jsonContent)} />
          <p className="text-muted-foreground font-light text-xs">Defining a Job</p>
        </div> */}

      </div>
    </div>
  );
}
