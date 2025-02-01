import { PackageJson } from './types';
import semver from 'semver';

export default class Updater {
    private packageJson: PackageJson;
    constructor(packageJson: PackageJson) {
        this.packageJson = packageJson;
    }

    public async isLatest(): Promise<boolean> {
        const repoIdentifier: string = this.packageJson.repository.url.match(/[^\/]+\/[^\/]+(?=.git)/g)![0];
        const latestVersion: string = await this.getLatestVersion(repoIdentifier);
        return !semver.gt(latestVersion, this.packageJson.version);
    }

    private async getLatestVersion(repoIdentifier: string): Promise<string> {
        const response: Response = await fetch(`https://raw.githubusercontent.com/${repoIdentifier}/main/package.json`);
        const remotePackageJson: PackageJson = await response.json();
        return remotePackageJson.version;
    }
}