import Utility from './utility.js';
import Obsr from 'obsr';

export default function Model (data) {
	this.collection = data.collection;
}

Model.prototype.get = function (path) {
	return Utility.getByPath(this.collection, path);
};

Model.prototype.set = function (path, data) {
	Utility.setByPath(this.collection, path, data);
};

Model.prototype.toView = function (callback) {
	this.collection = Obsr(this.collection, callback);
};
