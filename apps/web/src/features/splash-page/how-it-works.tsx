import { CheckCircle, Clock, Code, Send, Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="py-16 px-4 w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Define your logic, send context, and let the scheduler handle the rest.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-3 gap-6 w-full">
          {/* Step 1 */}
          <Card
            className={`group transition-all duration-500 delay-100 hover:shadow-lg ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <CardContent className="p-6 w-full">
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <Code className="w-2.5 h-2.5 text-primary" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">Write the Rule & Set Webhooks</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Describe what should happen and where to send the request.
              </p>

              {/* Code Block */}
              <div className="relative w-full">
                <div className="bg-secondary/50 dark:bg-secondary/20 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">config.json</span>
                  </div>
                  <pre className="text-xs text-foreground/90 leading-relaxed overflow-x-auto">
                    <code>
                      {`{
  "description": "Run health check every 15 minutes unless error rate is high",
  "endpoints": {
    "onExecute": "https://api.mysite.com/check-health",
    "onFail": "https://hooks.slack.com/error-report"
  }
}`}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20">
                <p className="text-xs text-primary font-medium">This is the only thing you need to define upfront</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card
            className={`group transition-all duration-500 delay-200 hover:shadow-lg ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <CardContent className="p-6">
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Send className="w-2.5 h-2.5 text-green-600" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">Send Conditions to the Scheduler</h3>
              <p className="text-sm text-muted-foreground mb-4">Post live metrics or values to a single endpoint.</p>

              {/* Code Block */}
              <div className="relative">
                <div className="bg-secondary/50 dark:bg-secondary/20 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">payload.json</span>
                  </div>
                  <pre className="text-xs text-foreground/90 leading-relaxed">
                    <code>
                      {`{
  "cpu": 84,
  "errors": 2.3,
  "memory": 68
}`}
                    </code>
                  </pre>
                </div>
              </div>

              {/* API Endpoint */}
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/50 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-xs">
                    POST
                  </Badge>
                  <code className="text-xs font-mono text-foreground">/api/job/:id</code>
                </div>
              </div>

              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Just send data — the system updates automatically
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card
            className={`group transition-all duration-500 delay-300 hover:shadow-lg ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <CardContent className="p-6">
              {/* Step Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-purple-600" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-2">We Run It When It Makes Sense</h3>
              <p className="text-sm text-muted-foreground mb-4">Tasks only run when rules and context align.</p>

              {/* Execution Timeline */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-medium">12:00</span>
                      <span className="text-muted-foreground truncate">Skipped — No data available</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-medium">12:15</span>
                      <span className="text-green-700 dark:text-green-400 truncate">
                        Triggered — Errors
                        {">"}
                        {" "}
                        2%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Indicator */}
              <div className="mt-4 flex justify-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-green-600 rounded-full animate-ping opacity-20" />
                </div>
              </div>

              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md border border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-700 dark:text-purple-400 font-medium text-center">
                  Smart execution based on real conditions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Summary */}
        <div
          className={`mt-12 text-center transition-all duration-500 delay-400 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Card className="inline-block max-w-2xl">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">That's it!</h3>
              <p className="text-muted-foreground">
                Describe the job, provide your endpoint, and the system figures out the timing.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
