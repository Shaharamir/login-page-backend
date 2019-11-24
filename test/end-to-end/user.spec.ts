const request = require('supertest');
const expect = require('chai').expect;
const app = require('../../index');
const server = request(app);

const route = "/user";
describe("User end to end test", function() {
    it('Returns some data', () => {
        return server.get(`${route}/2`)
            .expect(200)
            .expect(res => {
                expect(res.text).to.equal("User get");            
            });
    });

});