import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/react/ui/accordion";

interface FAQItem {
	question: string;
	answer: string;
}

export function FAQList({ items }: { items: readonly FAQItem[] }) {
	return (
		<Accordion type="single" collapsible className="w-full">
			{items.map((item, i) => (
				<AccordionItem key={item.question} value={`faq-${i}`}>
					<AccordionTrigger className="text-base">
						{item.question}
					</AccordionTrigger>
					<AccordionContent>{item.answer}</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}
