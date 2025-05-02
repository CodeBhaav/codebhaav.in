import { env } from "@/env";
import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components";

const baseUrl = env.BASE_URL;

interface FoundingMemberEmailProps {
	name: string;
}

const FoundingMemberEmail = ({ name }: FoundingMemberEmailProps) => (
	<Html>
		<Head />
		<Preview>Thank you for your CodeBhaav founding member application!</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={box}>
					<Img
						src={`${baseUrl}/logo.webp`}
						width="49"
						height="21"
						alt="CodeBhaav Logo"
					/>
					<Hr style={hr} />
					<Text style={paragraph}>Thank You, {name}!</Text>
					<Text style={paragraph}>
						We've received your application to become a founding member of
						CodeBhaav.
					</Text>
					<Text style={paragraph}>
						Our team will carefully review your submission and get back to you
						shortly. We're excited to build something real together.
					</Text>
					<Text style={paragraph}>Stay tuned and keep building. 🔥</Text>
					<Hr style={hr} />
					<Text style={paragraph}>– CodeBhaav Team</Text>
					<Hr style={hr} />
					<Text style={footer}>CodeBhaav, Inc.</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

const main = {
	backgroundColor: "#f6f9fc",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
	backgroundColor: "#ffffff",
	margin: "0 auto",
	padding: "20px 0 48px",
	marginBottom: "64px",
};

const box = {
	padding: "0 48px",
};

const hr = {
	borderColor: "#e6ebf1",
	margin: "20px 0",
};

const paragraph = {
	color: "#525f7f",
	fontSize: "16px",
	lineHeight: "24px",
	textAlign: "left" as const,
};

const footer = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "16px",
};

export default FoundingMemberEmail;
