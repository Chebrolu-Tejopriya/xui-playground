/**
 * What a demo declares about itself.
 *
 * Only what cannot be derived. The owner comes from the folder name and the
 * date from git, because both of those rot the moment they are typed by hand —
 * the same reason nothing in XUI keeps a list of components by hand either.
 */
export interface DemoMeta {
  /** Shown on the card and in the sidebar. Sentence case, no "Demo" suffix. */
  title: string;
  /** Drives the ALL / MOBILE / WEB filter, and the frame the demo renders in. */
  platform: 'mobile' | 'web';
  /** One line under the title. Optional; say what it explores, not what it is. */
  note?: string;
}
