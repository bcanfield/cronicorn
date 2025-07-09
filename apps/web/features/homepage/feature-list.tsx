import { BevelContainer } from "@/components/ui/bevel-container";

export const FeatureList = ({
	header,
	items,
}: {
	header: string;
	items: { title: string; subTitle: string; content: React.ReactNode; icon: React.ReactNode }[];
}) => {
	return (
		<BevelContainer innerClassName="p-2 bg-popover" variant="in">
			<div className="space-y-2 text-left font-family-body">
				<h2 className="text-popover-foreground text-sm font-family-body text-center uppercase">[ {header} ]</h2>
				<div className="space-y-8">
					{items.map((item) => (
						<div key={item.title}>
							<div className="flex items-center gap-1">
								{item.icon} <h3 className="font-semibold  text-sm font-family-body">{item.title}</h3>
							</div>
							<p className="text-xs text-muted-foreground mb-2">{item.subTitle}</p>
							{/* <div className="flex items-center bg-card border-border/70 border p-2 text-xs">
								<div className="w-2 h-full bg-red-500"></div>
								{item.content}
							</div> */}
							<div className="flex items-center border-l-2 bg-primary/7 border-border/70  p-2 text-xs">
								{item.content}
							</div>
						</div>
					))}
				</div>
			</div>
		</BevelContainer>
	);
};
