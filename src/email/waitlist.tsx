import { env } from "@/env";
import {
	Body,
	Button,
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

interface WaitlistJoinEmailProps {
	name: string;
	referralPosition: number;
}

const WaitlistJoinEmail = ({
	name,
	referralPosition,
}: WaitlistJoinEmailProps) => (
	<Html>
		<Head />
		<Preview>You're officially on the CodeBhaav waitlist!</Preview>
		<Body style={main}>
			<Container style={container}>
				<Section style={box}>
					<Img
						src={`${baseUrl}/logo.png`}
						width="49"
						height="21"
						alt="Stripe"
					/>
					<Hr style={hr} />
					<Text style={paragraph}>Welcome to CodeBhaav, {name}!</Text>
					<Text style={paragraph}>
						You're officially on the waitlist. 🎉 Your current position is{" "}
						<strong>#{referralPosition}</strong>.
					</Text>
					<Text style={paragraph}>
						Share your referral link and climb up the list! The more friends you
						refer, the sooner you get access.
					</Text>
					<Button style={button} href="https://codebhaav.com/share">
						Share your referral link
					</Button>
					<Hr style={hr} />
					<Text style={paragraph}>
						Thanks for joining an authentic tech community. We're excited to
						have you onboard!
					</Text>
					<Text style={paragraph}>— The CodeBhaav Team</Text>
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

const anchor = {
	color: "#556cd6",
};

const button = {
	backgroundColor: "#656ee8",
	borderRadius: "5px",
	color: "#fff",
	fontSize: "16px",
	fontWeight: "bold",
	textDecoration: "none",
	textAlign: "center" as const,
	display: "block",
	width: "100%",
	padding: "10px",
};

const footer = {
	color: "#8898aa",
	fontSize: "12px",
	lineHeight: "16px",
};

export default WaitlistJoinEmail;
