import request from 'supertest';
import app from '../app.js'; // 

describe('Teams and Games API Integration Tests', () => {
  let teamSlug: string;
  let teamId: number;
  let gameId: number;

  test('Create a new team', async () => {
    const teamData = {
        name: 'Test Team',
        description: 'A description for the test team.'
      };

    const response = await request(app)
      .post('/api/teams')
      .send(teamData)
      .expect(200);

    teamId = response.body.id; // Save the team ID for later tests
    teamSlug = response.body.slug; // Save the slug for updating/deleting tests
    expect(response.body.name).toBe(teamData.name);
    expect(response.body.description).toBe(teamData.description);
    expect(typeof response.body.slug).toBe('string');
    expect(response.body.slug).not.toBe('');
  });

  test('Patch the created team', async () => {
    const newName = 'Updated Test Team';
    await request(app)
      .patch(`/api/teams/${teamSlug}`)
      .send({
        name: newName
      })
      .expect(200); // Adjust based on your API's response

    // Optionally, fetch the team to verify the update
    const response = await request(app).get(`/api/teams/${teamSlug}`);
    expect(response.body.name).toBe(newName);
  });

  test('Create a new game associated with the team', async () => {
    const response = await request(app)
      .post('/api/games')
      .send({
        date: new Date().toISOString(),
        home: teamId,
        away: teamId, // Assuming self-play for simplicity; adjust as needed
        home_score: 3,
        away_score: 1
      })
      .expect(200); // Verify the expected success code

    gameId = response.body.id; // Save the game ID for deletion
    expect(response.body.home).toBe(teamId);
  });

  test('Delete the created game', async () => {
    await request(app)
      .delete(`/api/games/${gameId}`)
      .expect(204); // or another success status code based on your API
  });

  test('Delete the created team', async () => {
    await request(app)
      .delete(`/api/teams/${teamSlug}`)
      .expect(204); // Adjust based on your API's response for a successful deletion
  });
});