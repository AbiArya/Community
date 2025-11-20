describe('Protected redirect', () => {
	it('redirects unauthenticated user to /login with redirect param', () => {
		cy.visit('/profile');
		cy.location('pathname').should('eq', '/login');
		cy.location('search').should('contain', 'redirect=');
	});
});


