import type { Logger } from 'pino';
import { ParsingError } from '../errors/ParsingError';
import type { RepoBranch } from '../types/git';
import { $ } from '../utils/shell';

type GitServiceOptions = {
    logger: Logger;
};

export class GitService {
    protected logger: Logger;

    constructor({ logger }: GitServiceOptions) {
        this.logger = logger.child({ module: 'GitService' });
    }

    async getCurrentRepoAndBranch(): Promise<RepoBranch> {
        this.logger.debug('Retrieving RepoBranch');
        const branch = (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
        const remoteUrl = (await $`git config --get remote.origin.url`.text()).trim();

        const match = remoteUrl.match(/(?:https?:\/\/github\.com\/|git@github\.com:)([^/]+)\/([^/\s.]+?)(?:\.git)?$/);
        if (!match || !match[1] || !match[2]) {
            const error = new ParsingError('remote URL', { remoteUrl, branch, match });
            this.logger.error(error);
            throw error;
        }

        const owner = match[1];
        const repoName = match[2];

        this.logger.debug({ owner, repoName, branch, remoteUrl }, 'RepoBranch retrieved');
        return { owner, repoName, branch };
    }
}
