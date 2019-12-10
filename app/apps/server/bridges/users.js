import { Meteor } from 'meteor/meteor';

import { saveUser, setUserAvatar, checkUsernameAvailability } from '../../../lib/server/functions';
import { Users } from '../../../models/server';
import { Roles } from '../../../models';

export class AppUserBridge {
	constructor(orch) {
		this.orch = orch;
	}

	async getById(userId, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the userId: "${ userId }"`);

		return this.orch.getConverters().get('users').convertById(userId);
	}

	async getByUsername(username, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the username: "${ username }"`);

		return this.orch.getConverters().get('users').convertByUsername(username);
	}

	async create(user, appId, { avatarUrl }) {
		this.orch.debugLog(`The App ${ appId } is requesting to create a new user.`);

		let newUserId;
		let isSuccess = true;
		Roles.findUsersInRole('admin').forEach((adminUser, index) => {
			if (index > 0) {
				return;
			}

			if (!checkUsernameAvailability(user.username)) {
				console.error(`A user with the App's username ${ user.username } has already existed, please rename or delete that user before installing the App.`);
				isSuccess = false;

				return;
			}

			newUserId = saveUser(adminUser._id, user);

			if (avatarUrl) {
				user._id = newUserId;
				Meteor.runAsUser(newUserId, () => setUserAvatar(user, avatarUrl));
			}
		});

		return isSuccess && newUserId;
	}

	async getActiveUserCount() {
		return Users.getActiveLocalUserCount();
	}
}
