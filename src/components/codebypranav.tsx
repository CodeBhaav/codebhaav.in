import Link from "next/link";

function CodeByPranav({
	link = "https://links.pranavbhatkar.me/from-codebhaav",
}: {
	link?: string;
}) {
	return (
		<div className="overflow-hidden">
			<Link
				href={link}
				aria-label="Pranav Bhatkar"
				className="logo font-inter font-medium"
			>
				<p className="copyright">©</p>
				<div className="name">
					<p className="codeBy">Code by</p>
					<p className="pranav">Pranav</p>
					<p className="bhatkar">Bhatkar</p>
				</div>
			</Link>
		</div>
	);
}

export default CodeByPranav;
