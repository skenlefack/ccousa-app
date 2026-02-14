import { Router, Request, Response } from 'express';
import usersController from '../controllers/users.controller';
import { checkConnection } from '../utils/database';

const router = Router();

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const dbConnected = await checkConnection();
  res.json({
    success: true,
    service: 'users-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: { database: dbConnected ? 'connected' : 'disconnected' },
  });
});

// Routes utilisateurs
router.get('/', (req, res) => usersController.getAll(req, res));
router.get('/stats', (req, res) => usersController.getStats(req, res));
router.get('/roles', (req, res) => usersController.getRoles(req, res));
router.get('/organizational-units', (req, res) => usersController.getOrganizationalUnits(req, res));

// Routes groupes (avant /:id pour éviter les conflits)
router.get('/groups', (req, res) => usersController.getGroups(req, res));
router.get('/groups/list', (req, res) => usersController.getGroups(req, res));
router.get('/groups/:id', (req, res) => usersController.getGroupById(req, res));
router.post('/groups', (req, res) => usersController.createGroup(req, res));
router.put('/groups/:id', (req, res) => usersController.updateGroup(req, res));
router.delete('/groups/:id', (req, res) => usersController.deleteGroup(req, res));
router.get('/groups/:id/members', (req, res) => usersController.getGroupMembers(req, res));
router.post('/groups/:id/members', (req, res) => usersController.addUserToGroup(req, res));
router.delete('/groups/:id/members/:userId', (req, res) => usersController.removeUserFromGroup(req, res));

// Routes permissions et rôles
router.get('/permissions/list', (req, res) => usersController.getPermissions(req, res));
router.get('/roles/list', (req, res) => usersController.getRolesWithPermissions(req, res));
router.post('/roles/create', (req, res) => usersController.createRole(req, res));
router.put('/roles/:id', (req, res) => usersController.updateRole(req, res));
router.post('/roles/:roleId/permissions', (req, res) => usersController.assignPermission(req, res));
router.delete('/roles/:roleId/permissions/:permissionId', (req, res) => usersController.revokePermission(req, res));

// Routes utilisateurs par ID (à la fin pour éviter les conflits)
router.get('/:id', (req, res) => usersController.getById(req, res));
router.post('/', (req, res) => usersController.create(req, res));
router.put('/:id', (req, res) => usersController.update(req, res));
router.delete('/:id', (req, res) => usersController.delete(req, res));
router.post('/:id/reset-password', (req, res) => usersController.resetPassword(req, res));

export default router;
