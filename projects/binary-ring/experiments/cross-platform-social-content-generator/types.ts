
export enum SocialPlatform {
  LinkedIn = 'LinkedIn',
  Twitter = 'Twitter',
  Instagram = 'Instagram',
}

export interface TextContent {
  linkedinPost: string;
  twitterPost: string;
  instagramCaption: string;
}

export interface ImageContent {
  [SocialPlatform.LinkedIn]: string | null;
  [SocialPlatform.Twitter]: string | null;
  [SocialPlatform.Instagram]: string | null;
}

export interface AspectRatios {
    [SocialPlatform.LinkedIn]: string;
    [SocialPlatform.Twitter]: string;
    [SocialPlatform.Instagram]: string;
}
