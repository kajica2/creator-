import React from 'react';

interface OnboardingScreenProps {
  onRequestInvite: () => void;
  onLaunchDemo: () => void;
  onSkipTour?: () => void;
}

const features = [
  {
    title: 'Hashtag Intelligence',
    description:
      'Curate context-aware hashtag sets to steer every piece of copy, image, or audio you generate. Start with our ready-made sets or spin up your own in seconds.',
  },
  {
    title: 'Creation Studio',
    description:
      'Jump into stories, visuals, lyrics, sites, and more without juggling different tools. Everything shares the same context so your output stays on-message.',
  },
  {
    title: 'Context Layer',
    description:
      'Blend personas, brand tone, and documents into a single brief. Our agents keep that context live across generators so you only set it once.',
  },
];

const roadmapHighlights = [
  {
    title: 'Invite-Only Access',
    description:
      'We’re onboarding partners gradually to keep quality high. Request an invite and we’ll reach out with next steps.',
  },
  {
    title: 'Free & Subscription Mix',
    description:
      'Core generators will stay free while advanced automations, batching, and co-pilot workflows roll into subscription tiers.',
  },
  {
    title: 'Assistant Optimization Layer',
    description:
      'Tap a new optimization surface purpose-built for GPT, Claude, and future assistants so teams can ship consistent prompts and responses.',
  },
];

const workflow = [
  {
    label: '1',
    title: 'Set the stage',
    description:
      'Pick a persona, drop in your brand context, or import reference docs so the platform understands your voice.',
  },
  {
    label: '2',
    title: 'Shape your canvas',
    description:
      'Select hashtags or ready-made sets that define the campaign. This tells every generator what to emphasize.',
  },
  {
    label: '3',
    title: 'Launch the demo',
    description:
      'Explore the invite-only demo environment, try out workflows, and see how the upcoming services fit your stack.',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onRequestInvite,
  onLaunchDemo,
  onSkipTour,
}) => {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 p-10 shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1 text-sm font-semibold text-purple-200">
              Invite-only beta · Demo available
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Welcome to the Viral Hashtag & Image AI Studio
            </h1>
            <p className="text-lg text-gray-200">
              We&apos;re rolling out access in curated waves to keep things personal. Click demo to get
              hands-on with today&apos;s feature set, or request an invite to join the roadmap as we
              plug in additional services—some free, some subscription-based, all designed to compound
              your reach.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onLaunchDemo}
                className="rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Launch Demo
              </button>
              <button
                onClick={onRequestInvite}
                className="rounded-xl border border-purple-400/60 bg-transparent px-6 py-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Request Invite
              </button>
              {onSkipTour && (
                <button
                  onClick={onSkipTour}
                  className="text-sm font-medium text-gray-400 underline-offset-4 transition hover:text-white hover:underline"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-purple-400/20 bg-black/30 p-6 backdrop-blur">
            <h2 className="text-sm font-semibold text-purple-200">What’s live today</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-purple-400" />
                Context-aware hashtag management with persona blending.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-purple-400" />
                Unified creation studio for copy, images, lyrics, and strategy.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-purple-400" />
                Demo workspace that mirrors upcoming co-pilot workflows.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-6 shadow-inner shadow-black/30 backdrop-blur transition hover:border-purple-500/40 hover:shadow-purple-900/30"
          >
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm text-gray-300">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gray-700/60 bg-gray-900/70 p-10">
        <h2 className="text-2xl font-bold text-white">How the beta works</h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-300">
          We&apos;re building alongside creators, agencies, and analysts who stress-test multi-format
          campaigns. The demo mirrors production, so you can pressure-test workflows before rolling
          them out across your team.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {workflow.map((step) => (
            <div key={step.title} className="rounded-2xl border border-gray-700/70 bg-gray-800/40 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-200">
                {step.label}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {roadmapHighlights.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6"
          >
            <h3 className="text-lg font-semibold text-purple-100">{item.title}</h3>
            <p className="text-sm text-purple-100/80">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gray-700/60 bg-gray-900/60 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3">
            <h2 className="text-2xl font-bold text-white">Optimization layer for modern assistants</h2>
            <p className="text-sm text-gray-300">
              We&apos;re introducing a new orchestration layer so teams can ship consistent, tuned
              prompts to GPT, Claude, and emerging assistants. Expect reusable prompt kits, guardrails,
              and analytics that help every teammate stay on-brand.
            </p>
            <p className="text-sm text-gray-400">
              Already working with LLMs today? Bring your existing prompts, and the platform will help
              you harmonize tone, length, and structure across assistants in minutes.
            </p>
          </div>
          <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent p-6 text-sm text-purple-100 shadow-lg shadow-purple-900/30">
            <h3 className="text-lg font-semibold text-white">Coming soon</h3>
            <ul className="mt-4 space-y-2">
              <li>• Prompt kits with shared governance</li>
              <li>• API hooks into your internal knowledge base</li>
              <li>• Multi-agent campaign simulations</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OnboardingScreen;


