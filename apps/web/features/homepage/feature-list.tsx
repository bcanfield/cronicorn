import { BevelContainer } from "@/components/ui/bevel-container";
import * as motion from "motion/react-client";

export const FeatureList = ({
	header,
	items,
}: {
	header: string;
	items: { title: string; subTitle: string; content: React.ReactNode; icon: React.ReactNode; animate?: boolean }[];
}) => {
	return (
		<BevelContainer innerClassName="p-2 bg-popover" variant="in">
			<div className="space-y-2 text-left font-family-body">
				<h2 className="text-popover-foreground text-sm font-family-body text-center uppercase">[ {header} ]</h2>
				<div className="space-y-8">
					{items.map(({ title, animate = true, content, icon, subTitle }) => (
						<motion.div
							key={title}
							// Initial animation properties
							initial={animate ? { opacity: 0, y: 50 } : {}}
							whileInView={animate ? { opacity: 1, y: 0 } : {}}
							transition={
								animate
									? {
											duration: 0.3,
											delay: 0.1,
											ease: [0.25, 0.4, 0.25, 1], // Custom cubic-bezier for smooth easing
										}
									: {}
							}
							viewport={
								animate
									? {
											once: true, // Only animate once when entering viewport
											margin: "-100px", // Trigger animation 100px before element enters viewport
										}
									: {}
							}
						>
							<div className="flex items-center gap-1">
								{icon} <h3 className="font-semibold  text-sm font-family-body">{title}</h3>
							</div>
							<p className="text-xs text-muted-foreground mb-2">{subTitle}</p>

							<div className="flex items-center border-l-2 bg-primary/7 border-border/70  p-2 text-xs">{content}</div>
						</motion.div>
					))}
				</div>
			</div>
		</BevelContainer>
	);
};
